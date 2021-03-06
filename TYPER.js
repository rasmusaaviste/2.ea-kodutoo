
var TYPER = function(){

	//singleton
    if (TYPER.instance_) {
        return TYPER.instance_;
    }
    TYPER.instance_ = this;

	// Muutujad
	this.WIDTH = window.innerWidth;
	this.HEIGHT = window.innerHeight;
	this.canvas = null;
	this.ctx = null;

	this.words = []; // kõik sõnad
	this.word = null; // preagu arvamisel olev sõna
	this.word_min_length = 3;
	this.guessed_words = 0; // arvatud sõnade arv

	this.init();
};

TYPER.prototype = {

	// Funktsioon, mille käivitame alguses
	init: function(){

		// Lisame canvas elemendi ja contexti
		this.canvas = document.getElementsByTagName('canvas')[0];
		this.ctx = this.canvas.getContext('2d');

		// canvase laius ja kõrgus veebisirvija akna suuruseks (nii style, kui reso)
		this.canvas.style.width = this.WIDTH + 'px';
		this.canvas.style.height = this.HEIGHT + 'px';

		//resolutsioon 
		// kui retina ekraan, siis võib ja peaks olema 2 korda suurem
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;

		// laeme sõnad
		this.loadWords();
	}, 

	loadPlayerData: function(){

		// küsime mängija nime ja muudame objektis nime
		var p_name = prompt("Sisesta mängija nimi");

		// Kui ei kirjutanud nime või jättis tühjaks
		if(p_name === null || p_name === ""){
			p_name = "Tundmatu";		
		}
		
		this.player = {name: p_name, score: 0, Id: parseInt(1000+Math.random()*999999)};
		this.playerArray=JSON.parse(localStorage.getItem('player'));
		
		if(!this.playerArray || this.playerArray.length===0){
			this.playerArray=[];
		}
		
		this.playerArray.push(this.player);
		console.log("lisatud");
		
		localStorage.setItem("player", JSON.stringify(this.playerArray));
		

		// Mänigja objektis muudame nime
		this.player.name = p_name; // player =>>> {name:"Romil", score: 0}
        console.log(this.player);
	}, 

	loadWords: function(){

        console.log('loading...');

		// AJAX http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
		var xmlhttp = new XMLHttpRequest();

		// määran mis juhtub, kui saab vastuse
		xmlhttp.onreadystatechange = function(){

			//console.log(xmlhttp.readyState); //võib teoorias kõiki staatuseid eraldi käsitleda

			// Sai faili tervenisti kätte
			if(xmlhttp.readyState == 4 && xmlhttp.status == 200){

                console.log('successfully loaded');

				// serveri vastuse sisu
				var response = xmlhttp.responseText;
				//console.log(response);

				// tekitame massiivi, faili sisu aluseks, uue sõna algust märgib reavahetuse \n
				var words_from_file = response.split('\n');
				//console.log(words_from_file);
                
                // Kuna this viitab siin xmlhttp päringule siis tuleb läheneda läbi avaliku muutuja
                // ehk this.words asemel tuleb kasutada typerGame.words
                
				//asendan massiivi
				typerGame.words = structureArrayByWordLength(words_from_file);
				console.log(typerGame.words);
				
				// küsime mängija andmed
                typerGame.loadPlayerData();

				// kõik sõnad olemas, alustame mänguga
				typerGame.start();
			}
		};

		xmlhttp.open('GET','./lemmad2013.txt',true);
		xmlhttp.send();
	}, 

	start: function(){

		// Tekitame sõna objekti Word
		this.generateWord();
		//console.log(this.word);

        //joonista sõna
		this.ctx.fillStyle='navy';
		this.word.Draw();

		// Kuulame klahvivajutusi
		window.addEventListener('keypress', this.keyPressed.bind(this));
		
		taimer();

	},
	
    generateWord: function(){

        // kui pikk peab sõna tulema, + min pikkus + äraarvatud sõnade arvul jääk 5 jagamisel
        // iga viie sõna tagant suureneb sõna pikkus ühe võrra
        var generated_word_length =  this.word_min_length + parseInt(this.guessed_words/5);

    	// Saan suvalise arvu vahemikus 0 - (massiivi pikkus -1)
    	var random_index = (Math.random()*(this.words[generated_word_length].length-1)).toFixed();

        // random sõna, mille salvestame siia algseks
    	var word = this.words[generated_word_length][random_index];
    	
    	// Word on defineeritud eraldi Word.js failis
        this.word = new Word(word, this.canvas, this.ctx);
    },
	
	saveScore: function() {

        //this.playerNameArray = JSON.parse(localStorage.getItem('playerName'));
        //gamesFromStorage = JSON.parse(localStorage.getItem("games"));

        this.playerArray.forEach(function (player, key) {
            //gamesFromStorage.forEach(function(game, key){

            console.log(player);
            console.log(typerGame.player);

            if (player.Id == typerGame.player.Id) {

                player.score = typerGame.player.score;

                console.log("updated");
                console.log(player);

            }

        });
		localStorage.setItem("player", JSON.stringify(this.playerArray));
    },
    
	keyPressed: function(event){

		//console.log(event);
		// event.which annab koodi ja fromcharcode tagastab tähe
		var letter = String.fromCharCode(event.which);
		//console.log(letter);

		// Võrdlen kas meie kirjutatud täht on sama mis järele jäänud sõna esimene
		//console.log(this.word);
		if(letter === this.word.left.charAt(0)){
			
			this.ctx.fillStyle='navy';

			// Võtame ühe tähe maha
			this.word.removeFirstLetter();

			// kas sõna sai otsa, kui jah - loosite uue sõna

			if(this.word.left.length === 0){

				this.guessed_words += 1;
				guessedWords=this.guessed_words;

                //update player score
                this.player.score = this.guessed_words;
				this.saveScore();

				//loosin uue sõna
				this.generateWord();
			}

			//joonistan uuesti
			this.word.Draw();
		}
		
		else{	
			blinkRed();	
			this.word.Draw();
			typo+=1;
		}			

	} // keypress end

};


/* HELPERS */
function structureArrayByWordLength(words){
    // TEEN massiivi ümber, et oleksid jaotatud pikkuse järgi
    // NT this.words[3] on kõik kolmetähelised

    // defineerin ajutise massiivi, kus kõik on õiges jrk
    var temp_array = [];

    // Käime läbi kõik sõnad
    for(var i = 0; i < words.length; i++){

        var word_length = words[i].length;

        // Kui pole veel seda array'd olemas, tegu esimese just selle pikkusega sõnaga
        if(temp_array[word_length] === undefined){
            // Teen uue
            temp_array[word_length] = [];
        }

        // Lisan sõna juurde
        temp_array[word_length].push(words[i]);
    }

    return temp_array;
}

window.onload = function(){
	var typerGame = new TYPER();
	window.typerGame = typerGame;
};

var night = 0;

function darkMode(){
	if(night==0){
		document.getElementById("kanvas").style.backgroundColor = "black";	
		console.log(kanvas);	
		night=1;
	}
	else if(night==1){
		document.getElementById("kanvas").style.backgroundColor = "white";	
		console.log(kanvas);
		night=0;
	}
}

var count = 0;
function playerName(){
    console.log("playerName");

	var div=document.createElement("div");
    var playerData = JSON.parse(localStorage.getItem("player"));


    playerData.sort(function(a, b) {
        return b.score - a.score;
    });

    playerData.forEach(function (player, key) {
        //gamesFromStorage.forEach(function(game, key){
        if(count>=10){
            return;
        }
        document.getElementById("top").innerHTML +="<br>"+(count+1)+" ) "+ player.name+"<a style='right: 50px; color: maroon;padding-top: 0px'>"+"   "+player.score+"</a>";
        count+=1;
    });
	document.getElementById("player").style.visibility="hidden";
}

var typo = 0;
var guessedWords = 0;
function taimer() {
    setTimeout(function(){ alert("Mäng läbi! Arvasid ära "+guessedWords+" sõna, ja tegid "+typo+" viga"); }, 20000);
}

function blinkRed(){
	document.getElementById("kanvas").style.backgroundColor = "red";
	if (night==0){
		setTimeout(function(){document.getElementById("kanvas").style.backgroundColor="white";},40);
	} else {
			setTimeout(function(){document.getElementById("kanvas").style.backgroundColor="black";},40);
	}
}
