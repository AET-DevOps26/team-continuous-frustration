FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY api/ api/
COPY services/flashcard-service/pom.xml services/flashcard-service/pom.xml
WORKDIR /app/services/flashcard-service
RUN mvn dependency:go-offline -q
COPY services/flashcard-service/src src/
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/services/flashcard-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
