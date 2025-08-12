/// <reference lib="deno.worker" />
import "./init.ts";
import { context, propagation, trace } from "npm:@opentelemetry/api";

const tracer = trace.getTracer("worker-thread");

self.onmessage = (event) => {
  const { type, traceContext, data } = event.data;

  if (type === "START_WORK") {
    // Reconstruct the span context from the serialized data
    const parentContext = propagation.extract(context.active(), traceContext);
    context.with(parentContext, () => {
      const baggage = propagation.getActiveBaggage();

      console.log("Worker Baggage", baggage?.getAllEntries());

      // Create a child span in the worker with the propagated context
      // const childSpan = tracer.startSpan('worker-operation' /*, {}, parentContext*/);
      tracer.startActiveSpan("worker-operation", (childSpan) => {
        console.log("Worker Span", trace.getActiveSpan()?.spanContext());

        // Perform work within the span context
        // context.with(trace.setSpan(parentContext, childSpan), () => {
        // Simulate some work
        childSpan.addEvent("Worker processing started");
        childSpan.setAttributes({
          "worker.message": data.message,
          "worker.thread": "background",
        });

        // Simulate async work
        setTimeout(() => {
          childSpan.addEvent("Worker processing completed");
          childSpan.end();

          // Send response back to main thread
          self.postMessage({
            type: "WORK_COMPLETE",
            result: `Processed: ${data.message}`,
          });
        }, 1000);
      });
    });
  }
};
