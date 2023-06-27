"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
------------PLAN D'ACTION POUR CE ROBOT DE MAITRE AMAURY------------
- Créer un objet dans lequel ranger mes données ❌
- Récupérer le nom et id du game dans MongoDB ✅
- Récupérer les donées sur Steam et créé une nouvelle collection SteamGame avec le mm id que pour la collection Game ❌
- Stocker mon objet en base de donnée Mongo : SteamGame❌
- Edit de la DB et pas ajout systémqtique ❌
- le robot se lance chaque lundi matin à 8h ❌
--------------------------------------------------------------------
*/
const mongoose_1 = __importDefault(require("mongoose"));
//Je crée un schéma pour récupérer mes games dans la collection game de MongoDB
const GameSchema = new mongoose_1.default.Schema({
    _id: String,
    name: String
});
//Je crée le model pour les games de la collection game de MongoDB
const GameModel = mongoose_1.default.model('Game', GameSchema);
//Je crée un schéma pour les gameSteam de la collection SteamGame de MongoDb
const GameSteamSchema = new mongoose_1.default.Schema({
    idGame: String,
    name: String,
    appid: String,
    type: String,
    requiredAge: Number,
    isFree: Boolean,
    supportedLanguage: String,
    headerImage: String,
    aboutTheGame: String,
    developers: [],
    publishers: [],
    genres: [],
    categories: [],
    price: String,
});
//Je crée le model pour les gameSteam de la collection SteamGame de MongoDb
const GameSteamModel = mongoose_1.default.model('SteamGame', GameSteamSchema);
//Méthode qui cherche les games de mongo et qui va requête l'api Steam pour ma collection SteamGame
function fetchGameSteam() {
    return __awaiter(this, void 0, void 0, function* () {
        //Je récupère la liste de tous les jeux de Steam
        const steamGamesAll = yield getAllGameWithSteam();
        try {
            const games = yield GameModel.find().exec();
            //Je parcours ma collection Game pour récupérer le Game
            for (let i = 0; i < games.length; i++) {
                const gameRecover = games[i];
                //Je parcours la liste récupérer avec GetAllGames de Steam
                for (let i = 0; i < steamGamesAll.applist.apps.length; i++) {
                    //Je tcheck de savoir si le nom match
                    if (gameRecover.name == steamGamesAll.applist.apps[i].name) {
                        let currentGameSteam = {
                            idGame: gameRecover._id,
                            name: steamGamesAll.applist.apps[i].name,
                            appid: steamGamesAll.applist.apps[i].appid,
                            type: "",
                            requiredAge: 0,
                            isFree: false,
                            supportedLanguage: "unknown",
                            headerImage: "",
                            aboutTheGame: "",
                            developers: [],
                            publishers: [],
                            categories: [],
                            genres: [],
                            price: ""
                        };
                        yield updateCurrentGameSteamWithSteam(currentGameSteam);
                        //await updateGameSteam(currentGameSteam)
                    }
                }
            }
        }
        catch (error) {
            console.log("Le dernier nous fait sortir avec un name undifined donc DON'T PANIC ! " + error);
        }
    });
}
function updateCurrentGameSteamWithSteam(currentGamesSteam) {
    return __awaiter(this, void 0, void 0, function* () {
        const oneGameSteam = yield getOneGameSteam(currentGamesSteam);
        for (const appIdKey in oneGameSteam) {
            if (oneGameSteam.hasOwnProperty(appIdKey)) {
                const oneGame = oneGameSteam[appIdKey];
                if (oneGame.success === true) {
                    if (oneGame.data.type != undefined) {
                        currentGamesSteam.type = oneGame.data.type;
                    }
                    if (oneGame.data.required_age != undefined) {
                        currentGamesSteam.requiredAge = oneGame.data.required_age;
                    }
                    if (oneGame.data.is_free != undefined) {
                        currentGamesSteam.isFree = oneGame.data.is_free;
                    }
                    if (oneGame.data.supported_languages != undefined) {
                        currentGamesSteam.supportedLanguage = oneGame.data.supported_languages;
                    }
                    if (oneGame.data.header_image != undefined) {
                        currentGamesSteam.headerImage = oneGame.data.header_image;
                    }
                    if (oneGame.data.about_the_game != undefined) {
                        currentGamesSteam.aboutTheGame = oneGame.data.about_the_game;
                    }
                    if (oneGame.data.price_overview != undefined) {
                        currentGamesSteam.price = oneGame.data.price_overview.final_formatted;
                    }
                    if (oneGame.data.developers != undefined) {
                        for (let i = 0; i < oneGame.data.developers.length; i++) {
                            currentGamesSteam.developers.push(oneGame.data.developers[i]);
                        }
                    }
                    if (oneGame.data.publishers != undefined) {
                        for (let i = 0; i < oneGame.data.publishers.length; i++) {
                            currentGamesSteam.publishers.push(oneGame.data.publishers[i]);
                        }
                    }
                    if (oneGame.data.genres != undefined) {
                        for (let i = 0; i < oneGame.data.genres.length; i++) {
                            currentGamesSteam.genres.push(oneGame.data.genres[i].description);
                        }
                    }
                    if (oneGame.data.categories != undefined) {
                        for (let i = 0; i < oneGame.data.categories.length; i++) {
                            currentGamesSteam.categories.push(oneGame.data.categories[i].description);
                        }
                    }
                    let newGameSteam = new GameSteamModel(currentGamesSteam);
                    try {
                        yield newGameSteam.save();
                    }
                    catch (error) {
                        console.log("Une erreur s'est produite lors de la sauvegarde du jeu Steam et c'est clacké au sol : " + error);
                    }
                }
            }
        }
    });
}
function getOneGameSteam(currentGamesSteam) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://store.steampowered.com/api/appdetails/?appids=${currentGamesSteam.appid}`;
        // pour l'avoir en fr : à la fin de la requête rajouter '&l=french'
        //Utilise la requête et les autorisation
        const response = yield fetch(url);
        if (!response.ok) {
            throw new Error("Response not OK ! Bolosse");
        }
        return response.json();
    });
}
function getAllGameWithSteam() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "http://api.steampowered.com/ISteamApps/GetAppList/v2/";
        //Utilise la requête et les autorisation
        const response = yield fetch(url);
        if (!response.ok) {
            throw new Error("Response not OK ! Bolosse");
        }
        return response.json();
    });
}
//POUR LE MOMENT ELLE SERT A RIEN PUTAIN !!! 
function updateGameSteam(gameData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, name, } = gameData;
        try {
            //Recherche du game existant avec l'ID actuel
            const existingGame = yield GameSteamModel.findById(id);
            if (existingGame) {
                //Je vérifie si la donnée à changer et la modif que si elle a changé
                //En vrai c'est nulle ! Va falloir trouver autre chose de mieux
                if (existingGame.name !== name) {
                    existingGame.name = name;
                }
                yield existingGame.save();
            }
            else {
                //Le game n'existe pas donc création d'un nouveau
                let newGame = new GameSteamModel({
                    _id: id,
                    name,
                });
                yield newGame.save();
            }
        }
        catch (error) {
            console.error("Erreur lors de l'enregistrement du gameSteam :", error);
        }
    });
}
function display() {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        //J'ouvre le flux vers mongoDB
        mongoose_1.default.connect("mongodb://127.0.0.1:27017/pixelhunt_db");
        console.log("Connexion à MongoDB avec le sourire !");
        yield fetchGameSteam();
        mongoose_1.default.disconnect();
        console.log("On ferme MongoDB à clef svp");
        const endTime = Date.now();
        calculateExecutionTime(startTime, endTime);
    });
}
//Pour moi : pour savoir combien de temps ça met
function calculateExecutionTime(startTime, endTime) {
    const executionTime = endTime - startTime;
    const minutes = Math.floor(executionTime / 60000);
    const seconds = Math.floor((executionTime % 60000) / 1000);
    const milliseconds = executionTime % 1000;
    console.log(`Temps d'exécution : ${minutes} minutes, ${seconds} secondes et ${milliseconds} millisecondes`);
}
display();
