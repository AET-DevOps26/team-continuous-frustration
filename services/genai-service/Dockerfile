FROM python:3.10-slim AS builder

WORKDIR /usr/src/app

RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip

COPY pyproject.toml setup.cfg README.md requirements.txt ./
COPY src ./src
COPY tests ./tests
RUN pip install --no-cache-dir -r requirements.txt
# Install the openapi_server package itself so it's importable from the venv
RUN pip install --no-cache-dir -e .


FROM python:3.10-slim AS test_runner
WORKDIR /tmp
COPY --from=builder /venv /venv
COPY --from=builder /usr/src/app/tests tests
COPY --from=builder /usr/src/app/src src
ENV PATH=/venv/bin:$PATH

# install test dependencies
RUN pip install --no-cache-dir pytest

# run tests
RUN pytest tests


FROM python:3.10-slim AS service
WORKDIR /app
COPY --from=builder /venv /venv
COPY --from=builder /usr/src/app/src ./src
ENV PATH=/venv/bin:$PATH
ENV PYTHONPATH=/app/src

CMD ["python3", "-m", "grpc_server.server"]
