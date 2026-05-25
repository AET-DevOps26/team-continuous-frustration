FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY api/ api/
COPY services/auth-service/pom.xml services/auth-service/pom.xml
WORKDIR /app/services/auth-service
RUN mvn dependency:go-offline -q
COPY services/auth-service/src src/
RUN mvn package -DskipTests -q

FROM maven:3.9-eclipse-temurin-21 AS dev
WORKDIR /app/services/auth-service
EXPOSE 8081
CMD ["mvn", "spring-boot:run", "-q", "-Dspring-boot.run.fork=false"]

FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
COPY --from=build /app/services/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
