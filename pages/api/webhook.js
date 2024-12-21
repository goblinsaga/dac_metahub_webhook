const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const app = express().use(bodyParser.json());

// Variables de entorno
const API_KEY = process.env.API_KEY;
const DAC_API_URL = process.env.DAC_API_URL || "https://dac-api.metahub.finance/partners/missionCompleted/";

// Endpoint principal para manejar eventos del webhook
app.post("/webhook", async (req, res) => {
    const body = req.body;

    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Validación básica del evento
    if (body && body.eventName === "DAC_VERIFY_TASK") {
        try {
            const { eventName, identity, questId, taskId, taskInfo } = body;

            console.log("Processing event:", eventName);

            // Lógica de validación personalizada
            const userEligible = checkTaskCompletion(taskId, identity);

            // Payload para enviar a Metahub
            const payload = {
                taskId: taskId,
                identity: identity.address || identity.email,
                status: userEligible,
                reason: userEligible
                    ? "User has completed the task"
                    : "User has not completed the task",
            };

            // Llamada a la API de Metahub
            const response = await axios.post(`${DAC_API_URL}${questId}`, payload, {
                headers: {
                    "api-key": API_KEY,
                    "Content-Type": "application/json",
                },
            });

            console.log("Metahub API response:", response.data);

            // Respuesta al servidor de Metahub
            return res.status(200).json({
                success: true,
                message: "Task verification handled successfully",
            });

        } catch (error) {
            console.error("Error processing webhook:", error.message);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    } else {
        return res.status(404).json({
            success: false,
            message: "Unsupported event or invalid payload",
        });
    }
});

// Función para validar tareas completadas
function checkTaskCompletion(taskId, identity) {
    console.log(`Validating task for Task ID: ${taskId}`);
    const validTaskIds = [
        "0193e9b5-5aa7-755a-89f9-d810292f8d13",
        "0193e9b6-69e5-755a-89f9-e60e1dd5d956"
    ];

    if (validTaskIds.includes(taskId)) {
        console.log(`Task ${taskId} completed successfully`);
        return true;
    }

    console.log(`Task ${taskId} is not recognized`);
    return false;
}

// Ruta base para probar el servidor
app.get("/", (req, res) => {
    res.status(200).send("Hello! This is the Metahub webhook setup.");
});
