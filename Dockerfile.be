# Backend container - Spring Boot with Java 21
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY be/pom.xml be/pom.xml
COPY be/.mvn .mvn
COPY be/mvnw mvnw

# Download dependencies (layer caching)
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code
COPY be/src ./src

# Build JAR
RUN chmod +x ./mvnw && ./mvnw package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Add non-root user for security
RUN addgroup -S planwise && adduser -S planwise -G planwise
USER planwise

# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run application (no actuator - using basic TCP check for health)
ENTRYPOINT ["java", "-jar", "-Xms256m", "-Xmx512m", "app.jar"]
