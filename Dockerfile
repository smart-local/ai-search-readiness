# AI Search Readiness - https://github.com/smart-local/ai-search-readiness
# Maintained by Smart Local (https://smart-local.com.au/)
FROM python:3.12-alpine

LABEL org.opencontainers.image.title="ai-search-readiness" \
      org.opencontainers.image.description="Check a local business web page for Google and AI search readiness: on-page tags, JSON-LD schema, NAP consistency and AI crawler access in robots.txt." \
      org.opencontainers.image.url="https://smart-local.com.au/" \
      org.opencontainers.image.source="https://github.com/smart-local/ai-search-readiness" \
      org.opencontainers.image.documentation="https://github.com/smart-local/ai-search-readiness#readme" \
      org.opencontainers.image.vendor="Smart Local" \
      org.opencontainers.image.licenses="MIT"

RUN adduser -D -u 10001 app
WORKDIR /work
COPY --chmod=0755 ai_search_readiness.py /usr/local/bin/ai-search-readiness
USER app

ENTRYPOINT ["ai-search-readiness"]
CMD ["--help"]
