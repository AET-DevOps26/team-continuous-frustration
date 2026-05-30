FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY services/api-gateway/pom.xml services/api-gateway/pom.xml
WORKDIR /app/services/api-gateway
RUN mvn dependency:go-offline -q
COPY services/api-gateway/src src/
RUN mvn package -DskipTests -q

FROM maven:3.9-eclipse-temurin-21 AS dev
WORKDIR /app/services/api-gateway
EXPOSE 8080
CMD ["mvn", "spring-boot:run", "-q", "-Dspring-boot.run.fork=false"]

FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
COPY --from=build /app/services/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
