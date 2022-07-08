class Deck {                                    // import Deck from '../deck';
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.cards = [];
        this.colors = [];                           
    }

    addCard(name, id, qty = 1) {
        for(let i = 0; i < qty; i++) {
            this.cards.push(new Card(name, id));
        }
    }
    removeCard(id) {
        let index = this.cards.findLastIndex( card => (card.id === id));
        if(index == -1) return false; 
        this.cards.splice( index, 1 );
        return true;
    }
}

class Card {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
}

var currentDeck = null;
var currentCard = null;

class DecksAPI {
    static URL = '/api/decks';
    
    static getAllDecks() {                          // fetch ALL decks in the api data store
        return $.get(this.URL);
    }

    static getDeck(id) {                            // fetch a deck by ID
        return $.get(this.URL + `/${id}`);
    }

    static createDeck(deckData) {                   // data includes { name, cards[], colors[] } but id must be given by the server/api
        return axios.post(this.URL, deckData);      // NOTE: Using Axios because jQuery wouldn't work
    }

    static getCard(name) {                          // fetch a card by name or first few letters
        return $.get(`/api/cards/${name}`);         // returns { cardName: "name", cardID: 000 }
    }

    static updateDeck(deckData) {                   // update a deck already created
        return $.ajax({
            method: 'PUT', 
            url: this.URL + `/${deckData.id}`,
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(deckData)
        });
    }

    static deleteDeck(id) {                         // delete a deck
        return $.ajax({
            method: 'DELETE',
            url: this.URL + `/${id}`,
        });
    }
}

class DisplayUpdater {

    static prependDeck(deck) {
        $('#my-decks').prepend(                                     // The HTML for each deck entry
        `<div id="${deck.id}" class="frame entry-item">
            <div><h3>#${deck.id} - ${deck.name}</h3>
            ${deck.cards.length} cards - ${deck.colors}</div>
            <div class="btn-block">
                <div class="btn-panel">
                    <button class="btn btn-primary app-btn" onclick="DisplayUpdater.editDeck(${deck.id})">Edit</button>
                    <button class="btn btn-danger app-btn" onclick="DisplayUpdater.clearDeck(${deck.id})">Delete</button>
                </div>
            </div>
        </div>`);
    }
    
    static refreshAllDecks() { 
        DecksAPI.getAllDecks().then(decks => {                      // retrieve all decks, if any
            if(!decks) return;
            // this.allDecks = decks;
            this.displayDecks(decks);                                    // then display them on the page
        }); 
    }

    static displayDecks(decks) {
        $('#my-decks').empty();                                     // first empty div and
        for(let deck of decks) {                            // then repopulate it
            this.prependDeck(deck);                                 // in LIFO order
        } 
    }

    static addNewDeck(deckName) {
        if(!deckName) return;                                               
        DecksAPI.createDeck( {"name": `${deckName}`} )    // post new deck to data store
            .then( (result) => {
                if(result.data.success) DisplayUpdater.prependDeck(result.data.deck);
                else console.log("Error: could not create a new deck");
            });
        $('#new-deck-name').val('');
    }

    static editDeck(id) {                                           
        DecksAPI.getDeck(id).then( (result) => {                    // call up a deck's info for editing
            console.log(result);
            if(result.success) {
                
                currentDeck = new Deck( result.deck.name, result.deck.id, result.deck.colors );    // {id: result.id, name: result.name, cards: result.cards, colors: result.colors}
                currentDeck.cards = result.deck.cards;

                $('#editor').show("slow");                          // show editor
                $('#deck-id').val( currentDeck.id );                // populate fields with deck data
                $('#deck-name').val( currentDeck.name );                 
                $('#card-count').val( currentDeck.cards.length );
                for(let color of currentDeck.colors) {
                    $(`#check-${color}`).attr('checked', true);
                }
            }
            else console.log("Error: could not retrieve existing deck");
        });
        // $('#editor').show();
    }

    static displayCard(name) {
        DecksAPI.getCard(name).then( (result) => {    // search for a card
            if(result.success) {
                currentCard = {name: `${result.cardName}`, id: `${result.cardID}`};
                $('#card-scan').attr('src', `/images/${currentCard.id}.jpeg`);   // show its image if found
                $('#search-field').val('');                                     // and reset input
            }
            // else show message
        });
    }

    static saveDeck() {
        //const sameID = $('#deck-id').val();                                 // grab deck ID
        const newName = $('#deck-name').val();                              // grab deck name
        //const newCount = $('#card-count').val();                            // grab cards
        const colorInputs = $('input[type=checkbox]:checked');              // grab (new) colors
        let newColors = [];
        for(let color of colorInputs) {
            newColors.push( color.value );
        }
        const deck = {...currentDeck, name: `${newName}`, colors: newColors};      // take id & cards and update name and colors if applicable
        DecksAPI.updateDeck(deck);  // @TODO:  Use  .then()  with feedback msg / successfully updated

        $('#deck-id').val('');                                 
        $('#deck-name').val('');                                            // clear inputs/#s                
        $('#card-count').val('0'); 
        colorInputs.attr('checked', false);

        $('#editor').hide("slow");                                          // hide editor
        console.log("deck updated");
    }

    static clearDeck(id) {                                          
        DecksAPI.deleteDeck(id).then( (result) => {                 // delete a deck from the api data store
            console.log(result);
        });
        $(`#${id}`).remove();                                       // and remove it from the DOM
    }
}

$('#refresh-btn').on('click', () => {
    DisplayUpdater.refreshAllDecks();                                   // fetch all decks in the data store
});

$('#create-deck-btn').on('click', () => {                         
    DisplayUpdater.addNewDeck( $('#new-deck-name').val() );             // create a new deck
});

$('#search-btn').on('click', () => {
    DisplayUpdater.displayCard( $('#search-field').val() )
});

$('#add-one').on('click', () => {
    if(currentDeck === null || currentCard === null)  {
        console.log("deck not loaded or card not selected");
        return;
    }
    currentDeck.addCard(currentCard.name, currentCard.id);
    document.getElementById('card-count').value++;
    // console.log(currentDeck.cards);
});

$('#add-four').on('click', () => {
    if(currentDeck === null || currentCard === null) return;
    let number = Number( $('#card-count').val() );                      // get current card count
    currentDeck.addCard(currentCard.name, currentCard.id, 4);
    number += 4;                                                        // add 4 to card count
    $('#card-count').val(number);
    // console.log(currentDeck.cards);
});

$('#remove-one').on('click', () => {
    if(currentDeck === null || currentCard === null) return;
    let wasRemoved = currentDeck.removeCard(currentCard.id);   // find an index of current card and splice it out
    if(wasRemoved) document.getElementById('card-count').value--;
    else console.log("card not found in deck");
});

$('#remove-all').on('click', () => {
    if(currentDeck === null) return;
    currentDeck.cards.length = 0;
    $('#card-count').val(0);
    console.log("all cards removed. click save to confirm.");
});

$('#save-btn').on('click', () => {
    DisplayUpdater.saveDeck();
});

$('#cancel-btn').on('click', () => {
    $('#deck-id').val('');                                 
    $('#deck-name').val('');                                            // clear inputs and #s                
    $('#card-count').val('0');
    const colorInputs = $('input[type=checkbox]:checked');
    colorInputs.attr('checked', false);
    $('#editor').hide("slow");                                          // hide editor
});