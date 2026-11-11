FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace
COPY pom.xml ./
COPY src ./src
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/frontend/public/anhbia /app/frontend/public/biasach /app/public/anhbia \
    && chown -R spring:spring /app
COPY --from=build --chown=spring:spring /workspace/target/library-management.jar /app/app.jar

USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=Asia/Ho_Chi_Minh", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
