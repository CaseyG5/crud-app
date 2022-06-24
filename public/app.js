
class Deck {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        // this.cards = [];
        this.numCards = 0;
        this.colors = [];                           // Deck & Card classes not used yet
    }

    addCard(name, id, qty = 1) {
        for(let i = 0; i < qty; i++) {
            this.cards.push(new Card(name, id));
        }
    }
}

class Card {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        // uuid set later?
    }
}

class DecksAPI {
    static URL = '/api/decks';

    static getAllDecks() {                          // fetch ALL decks in the api data store
        return $.get(this.URL);
    }

    static getDeck(id) {                            // fetch a deck by ID
        return $.get(this.URL + `/${id}`);
    }

    static createDeck(deckData) {                   // data includes { name, numCards, colors[] } but id must be given by the server/api
        return axios.post(this.URL, deckData);      // NOTE: Using Axios because jQuery wouldn't work
    }

    static getCard(name) {                          // fetch a card by name or first few letters
        return $.get(`/api/cards/${name}`);
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
    static allDecks = [];

    static prependDeck(deck) {
        $('#my-decks').prepend(                                     // The HTML for each deck entry
        `<div id="${deck.id}" class="frame entry-item">
            <div><h3>#${deck.id} - ${deck.name}</h3>
            ${deck.numCards} cards - ${deck.colors}</div>
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
            this.allDecks = decks;
            this.displayDecks();                                    // then display them on the page
        }); 
    }

    static displayDecks() {
        $('#my-decks').empty();                                     // first empty div and
        for(let deck of this.allDecks) {                            // then repopulate it
            this.prependDeck(deck);                                 // in LIFO order
        } 
    }

    static clearDeck(id) {                                          
        DecksAPI.deleteDeck(id).then( (result) => {                 // delete a deck from the api data store
            console.log(result);
        });
        $(`#${id}`).remove();                                       // and remove it from the DOM
    }

    static editDeck(id) {                                           
        DecksAPI.getDeck(id).then( (result) => {                    // call up a deck's info for editing
            $('#deck-id').val( result.id );                         
            $('#deck-name').val( result.name );                 
            $('#card-count').val( result.numCards );
            for(let color of result.colors) {
                $(`#check-${color}`).attr('checked', true);
            }
            
        });
        // $('#editor').show();
    }
}

$('#refresh-btn').on('click', () => {
    DisplayUpdater.refreshAllDecks();                                   // fetch all decks in the data store
});

$('#create-deck-btn').on('click', async () => {                         // create a new deck and 
    const deckName = $('#new-deck-name').val();
    if(!deckName) return;                                               // save it to the data store
    const response = await DecksAPI.createDeck( {"name": `${deckName}`, "numCards": "0", "colors": ["colorless"]} )
        .then( (result) => {
            if(result.data) DisplayUpdater.prependDeck(result.data);
            else console.log("Error: could not create a new deck");
        });
    $('#new-deck-name').val('');
});

$('#search-btn').on('click', () => {
    DecksAPI.getCard( $('#search-field').val() ).then( (result) => {    // search for a card
        $('#card-scan').attr('src', `/images/${result.cardID}.jpeg`);   // show its image if found
    });
    $('#search-field').val('');
});

$('#add-four').on('click', () => {
    let number = Number( $('#card-count').val() );                      // add 4 to card count
    number += 4;                                                        // will later add 4 of a particular card
    $('#card-count').val(number);
});

$('#save-btn').on('click', () => {
    const sameID = $('#deck-id').val();                                 // grab deck ID
    const newName = $('#deck-name').val();                              // grab deck name
    const newCount = $('#card-count').val();                            // grab card count
    const colorInputs = $('input[type=checkbox]:checked');              // grab (new) colors
    let newColors = [];
    for(let color of colorInputs) {
        newColors.push( color.value );
    }
    const deck = {id: `${sameID}`, name: `${newName}`, numCards: `${newCount}`, colors: newColors};
    DecksAPI.updateDeck(deck);  // @TODO:  Use  .then()  with feedback msg / successfully updated
    $('#deck-id').val('');                                 
    $('#deck-name').val('');                                            // clear inputs/#s                
    $('#card-count').val('0'); 
    colorInputs.attr('checked', false);
});