FROM maven:3.9.11-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY be/pom.xml ./pom.xml
COPY be/.mvn .mvn
COPY be/mvnw ./mvnw

# Download dependencies (layer caching)
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code
COPY be/src ./src
RUN mvn -B -q -DskipTests package

# Build JAR
RUN chmod +x ./mvnw && ./mvnw package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S planwise && adduser -S planwise -G planwise
COPY --from=builder --chown=planwise:planwise /app/target/*.jar /app/app.jar

USER planwise
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD nc -z 127.0.0.1 8080 || exit 1

ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "/app/app.jar"]
