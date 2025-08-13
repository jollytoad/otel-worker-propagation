import { NodeSDK } from "npm:@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "npm:@opentelemetry/exporter-trace-otlp-proto";
import { getNodeAutoInstrumentations } from "npm:@opentelemetry/auto-instrumentations-node";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "npm:@opentelemetry/core";

// Initialize OpenTelemetry
if (Deno.env.get("OTEL_DENO") !== "true") {
  console.debug("Using NodeSDK OTEL");
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces",
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
} else {
  console.debug("Using Deno OTEL");

  if (Deno.env.get("OTEL_DENO_BUG_WORKAROUND") === "true") {
    console.debug("Using propagation bug workaround");
    // @ts-ignore: work-around Deno bug
    globalThis[Symbol.for("opentelemetry.js.api.1")].propagation =
      new CompositePropagator({
        propagators: [
          new W3CTraceContextPropagator(),
          new W3CBaggagePropagator(),
        ],
      });
  }
}
