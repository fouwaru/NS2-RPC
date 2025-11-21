import { Component, For, createSignal, createEffect, Show } from "solid-js";
import {
  GetGamesList,
  SetGame,
  SetGameWithImage,
  CheckConn,
  Reconnect,
  PinGame,
  GetPins,
  IsMac,
  SwitchToConsole,
  GetSwitch1Games,
  GetSwitch2Games,
} from "../wailsjs/go/main/App";
import { faGamepad, faThumbTack, faPowerOff, faWifi } from "@fortawesome/free-solid-svg-icons";
import Fa, { FaLayers } from "solid-fa";

const App: Component = () => {
  const [gamesList, setGamesList] = createSignal([
    { title: "Home", img: "home" },
  ]);
  const [pinsShow, setPinsShow] = createSignal(false);
  const [selection, setSelection] = createSignal("Home");
  const [selectedImage, setSelectedImage] = createSignal("home");
  const [status, setStatus] = createSignal("Online");
  const [connErr, setConnErr] = createSignal(false);
  const [isMac, setIsMac] = createSignal(false);
  const [currentConsole, setCurrentConsole] = createSignal("switch1");
  const [isLoading, setIsLoading] = createSignal(false);

  IsMac().then((result: boolean) => setIsMac(result));

  const connCheck = () => {
    CheckConn().then((result: boolean) => {
      if (result) setConnErr(true);
    });
  };

  const loadGames = async (console: string) => {
    setIsLoading(true);
    try {
      if (console === "switch2") {
        const result = await GetSwitch2Games();
        setGamesList(JSON.parse(result));
      } else {
        const result = await GetSwitch1Games();
        setGamesList(JSON.parse(result));
      }
    } catch (error) {
      console.error("Error loading games:", error);
    }
    setIsLoading(false);
  };

  const switchConsole = async (console: string) => {
    setIsLoading(true);
    const success = await SwitchToConsole(console);
    if (success) {
      setCurrentConsole(console);
      await loadGames(console);
    }
    setIsLoading(false);
  };

  createEffect(() => {
    selection();
    status();
    connCheck();
  });

  // Load initial games
  createEffect(() => {
    loadGames(currentConsole());
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white select-none">
      {/* Header */}
      <div class="bg-gradient-to-r from-red-600 to-pink-600 shadow-2xl">
        <div class={`${isMac() ? "pt-16" : "pt-6"} pb-6 px-6`}>
          <div class="flex items-center justify-center space-x-3">
            <FaLayers size="3x" class="text-white">
              <Fa icon={faGamepad} />
            </FaLayers>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
              NS2-RPC
            </h1>
          </div>
          <p class="text-center text-pink-100 mt-2">Discord Rich Presence for Nintendo Switch & Nintendo Switch 2</p>
          <p class="text-center text-sm text-pink-100 mt-2">Forked by Fouwaru</p>
        </div>
      </div>

      {/* Console Toggle */}
      <div class="px-6 py-4">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
          <h2 class="text-lg font-semibold mb-3 text-center">Select Console</h2>
          <div class="flex space-x-2 justify-center">
            <button
              class={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentConsole() === "switch1"
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              onClick={() => switchConsole("switch1")}
              disabled={isLoading()}
            >
              Nintendo Switch
            </button>
            <button
              class={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${currentConsole() === "switch2"
                ? "bg-purple-600 text-white shadow-lg scale-105"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              onClick={() => switchConsole("switch2")}
              disabled={isLoading()}
            >
              Nintendo Switch 2
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="px-6 pb-6">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          {/* Game Selection */}
          <div class="mb-6">
            <label for="games" class="block text-lg font-semibold mb-3 text-center">
              {!pinsShow() ? "Select Game" : "Pinned Games"}
            </label>
            <div class="relative">
              <select
                id="games"
                class="w-full bg-slate-700 border-2 border-slate-600 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors duration-300"
                onChange={(e) => {
                  const selectedTitle = e.currentTarget.value;
                  setSelection(selectedTitle);
                  // Find the corresponding image for the selected game
                  const selectedGame = gamesList().find(game => game.title === selectedTitle);
                  if (selectedGame) {
                    setSelectedImage(selectedGame.img);
                  }
                }}
                disabled={isLoading()}
              >
                <For each={gamesList()}>
                  {(game: { title: string; img: string }) => (
                    <option value={game.title} class="bg-slate-700">
                      {game.title}
                    </option>
                  )}
                </For>
              </select>
              {isLoading() && (
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Status Input */}
          <div class="mb-6">
            <label for="status" class="block text-lg font-semibold mb-3 text-center">
              Custom Status
            </label>
            <input
              id="status"
              class="w-full bg-slate-700 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors duration-300"
              onChange={(e) => setStatus(e.currentTarget.value)}
              placeholder="Online, Racing with friends, etc..."
            />
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col space-y-3">
            <div class="flex space-x-3">
              <button
                class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                onClick={() => SetGameWithImage(selection(), status(), selectedImage())}
                disabled={isLoading()}
              >
                <FaLayers class="mr-2">
                  <Fa icon={faPowerOff} />
                </FaLayers>
                Play Game
              </button>
              <button
                class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                onClick={() => SetGameWithImage("Home", "Idle", "home")}
                disabled={isLoading()}
              >
                Idle
              </button>
            </div>

            <div class="flex space-x-3">
              <button
                class="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl transition-colors duration-300"
                onClick={() => PinGame(selection())}
                disabled={isLoading()}
              >
                <FaLayers>
                  <Fa icon={faThumbTack} />
                </FaLayers>
              </button>
              <button
                class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-300"
                onClick={() => {
                  if (!pinsShow()) {
                    GetPins().then((result: string) => {
                      setGamesList(JSON.parse(result));
                    });
                  } else {
                    loadGames(currentConsole());
                  }
                  setPinsShow(!pinsShow());
                }}
                disabled={isLoading()}
              >
                {!pinsShow() ? "Show Pins" : "Show All Games"}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <Show when={connErr()}>
          <div class="mt-4 bg-red-600/20 border border-red-500 rounded-xl p-4 text-center">
            <div class="flex items-center justify-center space-x-2 mb-2">
              <Fa icon={faWifi} class="text-red-400" />
              <span class="font-semibold text-red-300">Connection Error</span>
            </div>
            <p class="text-red-200 text-sm mb-3">
              Couldn't connect to Discord. Make sure Discord is running.
            </p>
            <button
              onClick={() =>
                Reconnect().then((result: boolean) => {
                  if (result) setConnErr(false);
                })
              }
              class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Retry Connection
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default App;
