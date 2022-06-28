export default class Deck {
    constructor(name, id, colors = ["colorless"]) {
        this.name = name;
        this.id = id;
        this.cards = [];
        this.colors = colors;    
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
    }
}