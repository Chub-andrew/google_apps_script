var TOKEN = "<YOUR DATA>";
var sheet = SpreadsheetApp.openById('<YOUR DATA>').getActiveSheet();
var SHEET_NAME = "<YOUR DATA>";

var workouts = {
    "1": {
        "name": "Chest, Triceps, Shoulders 💪🏋️‍♂️",
        "exercises": [
            "Dumbbell Floor Press 🏋️‍♂️💪",
            "Dumbbell Flys on the Floor 🏋️‍♂️👐",
            "Standing Dumbbell Press 🏋️‍♂️⬆️",
            "Front Dumbbell Raise 🏋️‍♂️↗️",
            "Standing French Press 💪🎯",
            "Chair Dips 🪑🤸‍♂️"
        ]
    },
    "2": {
        "name": "Back, Biceps, Abs 💪🦵",
        "exercises": [
            "Bent-Over Dumbbell Rows 🏋️‍♂️↩️",
            "Single-Arm Dumbbell Row 💪🏋️‍♂️",
            "Dumbbell Bicep Curls 💪🔄",
            "Hammer Curls 🏋️‍♂️🔨",
            "Crunches 🤸‍♂️🔥",
            "Lying Leg Raises 🦵⬆️"
        ]
    },
    "3": {
        "name": "Legs, Glutes, Core 🦵🍑",
        "exercises": [
            "Dumbbell Squats 🏋️‍♂️🦵",
            "Forward Dumbbell Lunges 🚶‍♂️🏋️‍♂️",
            "Romanian Deadlifts with Dumbbells 🏋️‍♂️🔄",
            "Dumbbell Calf Raises 🦵⬆️",
            "Plank 🏋️‍♂️🛑",
            "Side Plank ➡️🏋️‍♂️"
        ]
    }
};


function doGet(e) {
    return ContentService.createTextOutput("Bot is running").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
    Logger.log('Request received: ' + JSON.stringify(e));

    if (!e || !e.postData || !e.postData.contents) {
        Logger.log('Invalid request received');
        return;
    }

    try {
        var contents = JSON.parse(e.postData.contents);
        Logger.log('Parsed contents: ' + JSON.stringify(contents));

        var message = contents.message;
        Logger.log('Parsed message: ' + JSON.stringify(message));

        if (!message || !message.text || !message.chat || !message.chat.id) {
            Logger.log('Invalid message structure');
            return;
        }

        var chat_id = message.chat.id;
        var text = message.text.trim();

        Logger.log('Received message: ' + text);
        Logger.log('Chat ID: ' + chat_id); // Log the chat ID

        // sendMessage(chat_id, "📩 You sent: " + text);

        var userProperties = PropertiesService.getUserProperties();
        var userState = JSON.parse(userProperties.getProperty(chat_id) || '{}');
        Logger.log('Current user state: ' + JSON.stringify(userState));

        if (text === "/start") {
            sendMessage(chat_id, "👋 Hello! Choose a workout day:\n 1️⃣ Day 1 (Chest, Triceps, Shoulders)\n 2️⃣ Day 2 (Back, Biceps, Abs)\n 3️⃣ Day 3 (Legs, Glutes, Core)");
            userState.step = "choose_day";
            userProperties.setProperty(chat_id, JSON.stringify(userState));
            Logger.log('Updated user state after /start: ' + JSON.stringify(userState));
            return;
        }

        if (userState.step === "choose_day") {
            Logger.log('In choose_day step');
            if (["1", "2", "3"].includes(text.trim())) {
                userState.day = text.trim();
                var exercises = workouts[text.trim()].exercises;
                var response = "📝 Choose an exercise:\n" + exercises.map((e, i) => `${i + 1}. ${e}`).join("\n");
                sendMessage(chat_id, response);
                userState.step = "choose_exercise";
                userProperties.setProperty(chat_id, JSON.stringify(userState));
                Logger.log('Updated user state after choosing day: ' + JSON.stringify(userState));
            } else {
                sendMessage(chat_id, "⚠️ Please enter 1, 2, or 3.");
            }
            return;
        }

        if (userState.step === "choose_exercise") {
            Logger.log('In choose_exercise step');
            var day = userState.day;
            var exercises = workouts[day].exercises;
            var exerciseIndex = parseInt(text) - 1;

            if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
                userState.exercise = exercises[exerciseIndex];
                sendMessage(chat_id, "📌 Enter data in the format: sets, reps, weight (kg)\nFor example: 3, 12, 50");
                userState.step = "enter_data";
                userProperties.setProperty(chat_id, JSON.stringify(userState));
                Logger.log('Updated user state after choosing exercise: ' + JSON.stringify(userState));
                return;
            } else {
                sendMessage(chat_id, "⚠️ Invalid exercise number. Choose from the list.");
                return;
            }
        }

        if (userState.step === "enter_data") {
            Logger.log('In enter_data step');
            var data = text.split(",").map(e => e.trim());
            if (data.length !== 3 || data.some(d => isNaN(d) || parseInt(d) <= 0)) {
                sendMessage(chat_id, "❌ Invalid format! Use: sets, reps, weight (kg)");
                return;
            }

            sheet.appendRow([
                new Date(),
                workouts[userState.day].name,
                userState.exercise,
                data[0],
                data[1],
                data[2]
            ]);

            sendMessage(chat_id, "✅ Workout saved!");
            userProperties.deleteProperty(chat_id);  // Clear user state
            Logger.log('Cleared user state: ' + JSON.stringify(userState));
            return;
        }

        sendMessage(chat_id, "⚠️ I don't understand your command. Enter /start to start over.");
    } catch (error) {
        Logger.log('Error processing request: ' + error.message);
        sendMessage(chat_id, "❌ An error occurred. Please try again.");
    }
}

function sendMessage(chat_id, text) {
    if (!chat_id) {
        Logger.log("Empty chat_id!");
        return;
    }

    if (!text || text.trim() === "") {
        Logger.log("Message text is empty!");
        return;
    }

    var url = "https://api.telegram.org/bot" + TOKEN + "/sendMessage";
    var payload = {
        "chat_id": chat_id,
        "text": text
    };

    var options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
    };

    try {
        var response = UrlFetchApp.fetch(url, options);
        Logger.log('Message sent successfully: ' + response.getContentText());
    } catch (e) {
        Logger.log("Error sending message: " + e.message);
    }
}
