# Propagating OpenTelemetry context into Workers

This demonstrates propagation of the OpenTelemetry context into Worker by
`inject`ing the context into a carrier and passing it as part of the message to
`postMessage`, then `extract`ing it and starting a new span.

Or rather, this is my understanding of how it should be done.

The only problem is that the propagation doesn't appear to work in Deno's native
OpenTelemetry support at present (v2.4.1).

## Usage

- `deno run start:deno` - run the example with native Deno OTEL
- `deno run start:node` - run the example with NodeSDK OTEL instead

You can also pass the argument `serve` to wrap the example in `Deno.serve`...

- `deno run start:deno serve`
- `deno run start:node serve`

and then hit the URL it gives.

## Outcomes

### `deno run start:deno`

```
Task start:deno OTEL_DENO=true ./main.ts
Using Deno OTEL
Main Span [Object: null prototype] {
  traceId: "14a985b730ca395a0d896ac21f3b1ffe",
  spanId: "fe955c0a759fbe47",
  traceFlags: 1
}
Context Carrier: {}
Using Deno OTEL
Worker Span [Object: null prototype] {
  traceId: "7494e7369a14ecf7014cb81247004c35",
  spanId: "24ecfec49a940c7c",
  traceFlags: 1
}
Response from worker: { type: "WORK_COMPLETE", result: "Processed: Hello from main thread" }
```

We can see that the context is not serialized to the `carrier` to be propagated
to the Worker, and so the span in the Worker belongs to a new `traceId`.

### `deno run start:node`

```
Task start:node ./main.ts
Using NodeSDK OTEL
Main Span {
  traceId: "ba2bf6c1079abf2e4aa749eea25a15de",
  spanId: "f06b1eb42ad8a0e0",
  traceFlags: 1,
  traceState: undefined
}
Context Carrier: {
  traceparent: "00-ba2bf6c1079abf2e4aa749eea25a15de-f06b1eb42ad8a0e0-01"
}
Using NodeSDK OTEL
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

## Conclusion

I believe this may be a bug in the Deno OpenTelemetry implementation.
