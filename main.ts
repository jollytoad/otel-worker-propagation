#!/usr/bin/env -S deno run -A --unstable-otel

import "./init.ts";
import { context, propagation, trace } from "npm:@opentelemetry/api";

// Create a span in the main thread
const tracer = trace.getTracer("main-thread");

function doit() {
  let baggage = propagation.getActiveBaggage() ?? propagation.createBaggage();

  baggage = baggage.setEntry("test", { value: "bagged" });

  console.log("Main Baggage", baggage?.getAllEntries());

  const baggageContext = propagation.setBaggage(context.active(), baggage);

  return tracer.startActiveSpan(
    "main-operation",
    {},
    baggageContext,
    (span) => {
      console.log("Main Span", trace.getActiveSpan()?.spanContext());

      // Create and configure the worker
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });

      const { promise, resolve } = Promise.withResolvers<Response>();

      // Handle worker responses
      worker.onmessage = (event) => {
        console.log("Response from worker:", event.data);

        // End the span when work is complete
        if (event.data.type === "WORK_COMPLETE") {
          span.addEvent("Worker complete");
          span.end();
          worker.terminate();
          resolve(new Response());
        }
      };

      span.addEvent("Worker started");

      // Serialize the span context for transmission
      const carrier: Record<string, string> = {};
      propagation.inject(context.active(), carrier);

      console.debug("Context Carrier:", carrier);

      // Send the serialized context to the worker
      worker.postMessage({
        type: "START_WORK",
        traceContext: carrier,
        data: { message: "Hello from main thread" },
      });

      return promise;
    },
  );
}

if (Deno.args[0] === "serve") {
  await Deno.serve(doit).finished;
} else {
  await doit();
}
