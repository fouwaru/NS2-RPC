package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/hugolgst/rich-go/client"
	"golang.org/x/exp/slices"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type App struct {
	ctx context.Context
}

type Games []struct {
	Title string `json:"title"`
	Img   string `json:"img"`
}

type Game struct {
	Title string `json:"title"`
	Img   string `json:"img"`
}

type Pins []string

var connErr bool = false

const switch1ClientID string = "1114647533562646700"
const switch2ClientID string = "1420215431465140285"
const gamesURL string = "https://raw.githubusercontent.com/fouwaru/NS2-RPC/refs/heads/master/games.json"

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Don't load games on startup - let the frontend handle it
	err := client.Login(switch1ClientID)
	if err != nil {
		connErr = true
	}
	err = client.SetActivity(client.Activity{
		LargeImage: "home",
		Details:    "Home",
		State:      "Idle",
	})
	if err != nil {
		panic(err)
	}
}

func (a *App) shutdown(ctx context.Context) {
	client.Logout()
}

func (a *App) CheckConn() bool {
	return connErr
}

func (a *App) Reconnect() bool {
	err := client.Login(switch1ClientID)
	if err != nil {
		return false
	}
	err = client.SetActivity(client.Activity{
		LargeImage: "home",
		Details:    "Home",
		State:      "Idle",
	})
	if err != nil {
		return false
	}
	connErr = false
	return true
}


func (a *App) GetGamesList() string {
	// Return Switch 1 games by default
	return a.GetSwitch1Games()
}

func (a *App) SetGame(title string, status string) {
	// Set the game activity with the game title as image key
	err := client.SetActivity(client.Activity{
		LargeImage: title, // Use the game title as the image key
		Details:    title,
		State:      cases.Title(language.English).String(status),
	})
	if err != nil {
		panic(err)
	}
}

func (a *App) SetGameWithImage(title string, status string, imageKey string) {
	// Set the game activity with a specific image key
	// Debug: Print the image key being used
	println("Setting game with image key:", imageKey)
	
	err := client.SetActivity(client.Activity{
		LargeImage: imageKey,
		Details:    title,
		State:      cases.Title(language.English).String(status),
	})
	if err != nil {
		panic(err)
	}
}

func LoadPinJson() Pins {
	var pins Pins
	configDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	configDir = filepath.Join(configDir, "NS-RPC")
	_, err = os.Stat(configDir)
	if err != nil {
		err = os.Mkdir(configDir, os.ModePerm)
		if err != nil {
			panic(err)
		}
	}
	pinsJson, err := os.Open(filepath.Join(configDir, "pinned.json"))
	if err == nil {
		defer pinsJson.Close()
		bytes, _ := io.ReadAll(pinsJson)
		json.Unmarshal(bytes, &pins)
	}
	return pins
}

func (a *App) PinGame(title string) {
	pins := LoadPinJson()
	configDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	removedPin := false
	for i, pin := range pins {
		if pin == title {
			pins = slices.Delete(pins, i, i+1)
			removedPin = true
			break
		}
	}
	if !removedPin {
		pins = append(pins, title)
	}
	file, _ := json.Marshal(pins)
	err = os.WriteFile(filepath.Join(configDir, "NS-RPC", "pinned.json"), file, os.ModePerm)
	if err != nil {
		panic(err)
	}
}

func (a *App) GetPins() string {
	pins := LoadPinJson()
	var pinMenu Games
	for _, pin := range pins {
		pinMenu = append(pinMenu, Game{Title: pin, Img: ""})
	}
	if len(pinMenu) == 0 {
		pinMenu = append(pinMenu, Game{Title: "No Pins!", Img: ""})
	}
	data, _ := json.Marshal(pinMenu)
	return string(data)
}

func (a *App) IsMac() bool {
	return runtime.GOOS != "windows"
}

func (a *App) SwitchToConsole(console string) bool {
	client.Logout()
	var clientID string
	if console == "switch2" {
		clientID = switch2ClientID
	} else {
		clientID = switch1ClientID
	}
	
	err := client.Login(clientID)
	if err != nil {
		connErr = true
		return false
	}
	err = client.SetActivity(client.Activity{
		LargeImage: "home",
		Details:    "Home",
		State:      "Idle",
	})
	if err != nil {
		connErr = true
		return false
	}
	connErr = false
	return true
}

func (a *App) GetSwitch1Games() string {
	// Try to read from local file first (much faster)
	file, err := os.ReadFile("games.json")
	if err == nil {
		return string(file)
	}
	
	// Fallback to remote URL only if local file doesn't exist
	resp, err := http.Get(gamesURL)
	if err != nil {
		return `[{"title": "Home", "img": "home"}]`
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return `[{"title": "Home", "img": "home"}]`
	}
	return string(body)
}

func (a *App) GetSwitch2Games() string {
	// Return Switch 2 specific games with correct image keys
	switch2Games := `[
		{"title": "Home", "img": "home"},
		{"title": "Mario Kart World", "img": "mkw"},
		{"title": "Cyberpunk 2077: Complete Edition", "img": "cp2077"}
	]`
	return switch2Games
}
