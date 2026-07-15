FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY api/ api/
COPY services/study-service/pom.xml services/study-service/pom.xml
WORKDIR /app/services/study-service
RUN mvn dependency:go-offline -q
COPY services/study-service/src src/
RUN mvn package -DskipTests -q

FROM maven:3.9-eclipse-temurin-21 AS dev
WORKDIR /app/services/study-service
EXPOSE 8083
CMD ["mvn", "spring-boot:run", "-q", "-Dspring-boot.run.fork=false"]

FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
COPY --from=build /app/services/study-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
