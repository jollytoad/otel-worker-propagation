import { NodeSDK } from "npm:@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "npm:@opentelemetry/exporter-trace-otlp-proto";
import { getNodeAutoInstrumentations } from "npm:@opentelemetry/auto-instrumentations-node";

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
}
