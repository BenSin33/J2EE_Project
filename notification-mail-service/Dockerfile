# Stage 1: Build JAR bằng Maven + JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime gọn nhẹ bằng JRE 21 Alpine
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/notification-mail-service-*.jar app.jar
ENV JAVA_OPTS="-Xms64m -Xmx224m"
EXPOSE 8083
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

