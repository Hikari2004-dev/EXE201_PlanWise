# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.11-eclipse-temurin-21-alpine AS builder

WORKDIR /app

COPY be/pom.xml .
RUN mvn -B dependency:go-offline -DoutputFile=/dev/null

COPY be/src ./src
RUN mvn -B -DskipTests package -q \
    && mv target/*.jar target/app.jar

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S planwise && adduser -S planwise -G planwise

WORKDIR /app

COPY --from=builder --chown=planwise:planwise /app/target/app.jar app.jar

USER planwise

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=90s --retries=10 \
  CMD nc -z 127.0.0.1 8000 || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
