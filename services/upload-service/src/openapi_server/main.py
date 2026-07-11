# coding: utf-8

import os

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from openapi_server.impl.controller import router as DefaultApiRouter

app = FastAPI(
    title="Document Upload Service API",
    description="Document Upload service endpoints",
    version="v1",
)

app.include_router(DefaultApiRouter)

Instrumentator().instrument(app).expose(app)

trace.set_tracer_provider(
    TracerProvider(resource=Resource.create({SERVICE_NAME: "upload-service"}))
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint=os.getenv("OTLP_EXPORTER_ENDPOINT", "jaeger:4317"),
            insecure=True,
        )
    )
)
FastAPIInstrumentor.instrument_app(app)
