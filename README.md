# Propagating OpenTelemetry context into Workers

This demonstrates propagation of the OpenTelemetry context into Worker by
`inject`ing the context into a carrier and passing it as part of the message to
`postMessage`, then `extract`ing it and starting a new span.

Or rather, this is my understanding of how it should be done.

The only problem is that the propagation doesn't appear to work in Deno's native
OpenTelemetry support at present (v2.4.3).

## UPDATE

> [!IMPORTANT]
> **This bug was fixed in Deno v2.6.2**

## Usage

- `deno task start:deno` - run the example with native Deno OTEL
- `deno task start:node` - run the example with NodeSDK OTEL instead

You can also pass the argument `serve` to wrap the example in `Deno.serve`...

- `deno task start:deno serve`
- `deno task start:node serve`

and then hit the URL it gives.

## Outcomes

### `deno task start:deno`

```
Task start:deno OTEL_DENO=true ./main.ts
Using Deno OTEL
Main Baggage [ [ "test", { value: "bagged" } ] ]
Main Span [Object: null prototype] {
  traceId: "14a985b730ca395a0d896ac21f3b1ffe",
  spanId: "fe955c0a759fbe47",
  traceFlags: 1
}
Context Carrier: {}
Using Deno OTEL
Worker Baggage undefined
Worker Span [Object: null prototype] {
  traceId: "7494e7369a14ecf7014cb81247004c35",
  spanId: "24ecfec49a940c7c",
  traceFlags: 1
}
Response from worker: { type: "WORK_COMPLETE", result: "Processed: Hello from main thread" }
```

We can see that the context is not serialized to the `carrier` to be propagated
to the Worker, and so the span in the Worker belongs to a new `traceId`.

> [!IMPORTANT]
> This bug was fixed in Deno v2.6.2

### `deno task start:node`

```
Task start:node ./main.ts
Using NodeSDK OTEL
Main Baggage [ [ "test", { value: "bagged" } ] ]
Main Span {
  traceId: "ba2bf6c1079abf2e4aa749eea25a15de",
  spanId: "f06b1eb42ad8a0e0",
  traceFlags: 1,
  traceState: undefined
}
Context Carrier: {
  traceparent: "00-ba2bf6c1079abf2e4aa749eea25a15de-f06b1eb42ad8a0e0-01"
  baggage: "test=bagged"
}
Using NodeSDK OTEL
Worker Baggage [ [ "test", { value: "bagged" } ] ]
Worker Span {
  traceId: "ba2bf6c1079abf2e4aa749eea25a15de",
  spanId: "9a0f753dbd54a58a",
  traceFlags: 1,
  traceState: undefined
}
Response from worker: { type: "WORK_COMPLETE", result: "Processed: Hello from main thread" }
```

And in this case, the `carrier` is correctly serialized and propagated, so the
Worker span inherits the `traceId` from the main thread.

### `deno task start:deno-workaround`

I've added an option to apply the
[work-around](https://github.com/denoland/deno/issues/28082#issuecomment-3183171095)
for trace context and baggage propagation...

```
Using Deno OTEL
Using propagation bug workaround
Main Baggage [ [ "test", { value: "bagged" } ] ]
Main Span [Object: null prototype] {
  traceId: "101eec1cf1b75be67fd66df2e0ec1723",
  spanId: "48abd1b60e5ed48b",
  traceFlags: 1
}
Context Carrier: {
  traceparent: "00-101eec1cf1b75be67fd66df2e0ec1723-48abd1b60e5ed48b-01",
  baggage: "test=bagged"
}
Using Deno OTEL
Using propagation bug workaround
Worker Baggage undefined
Worker Span [Object: null prototype] {
  traceId: "101eec1cf1b75be67fd66df2e0ec1723",
  spanId: "fd7a2c3cf660eb20",
  traceFlags: 1
}
Response from worker: { type: "WORK_COMPLETE", result: "Processed: Hello from main thread" }
```

### The work-around

> [!IMPORTANT]
> This work-around is no longer required since Deno v2.6.2

This is the work-around required to get propagation working in Deno's native
OpenTelemetry:

```
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "npm:@opentelemetry/core";

// @ts-ignore: work-around Deno bug
globalThis[Symbol.for("opentelemetry.js.api.1")].propagation =
  new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
    ],
  });
```

## Conclusion

I believe this may be a bug in the Deno OpenTelemetry implementation.

GitHub issues:

- https://github.com/denoland/deno/issues/30064 - my bug report
- https://github.com/denoland/deno/issues/28082 - similar issue showing
  work-around

> [!IMPORTANT]
> **This bug was fixed in Deno v2.6.2**
