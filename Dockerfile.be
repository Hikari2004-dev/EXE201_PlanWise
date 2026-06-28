FROM maven:3.9.11-eclipse-temurin-21-alpine AS builder

WORKDIR /app

COPY be/pom.xml ./pom.xml
RUN mvn -B -q dependency:go-offline

COPY be/src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S planwise && adduser -S planwise -G planwise
COPY --from=builder --chown=planwise:planwise /app/target/*.jar /app/app.jar

USER planwise
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD nc -z 127.0.0.1 8080 || exit 1

ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "/app/app.jar"]
