// Card Constructor
function Card(suit, number) {
    var mySuit = suit, myNumber = number,
        suits = {
                1: "clubs",
                2: "spades",
                3: "hearts",
                4: "diamonds"
            }, 
            ranks = {
                // anything else just reports the number
                1: "ace",
                11: "jack",
                12: "queen",
                13: "king"
            };

    this.getNumber = function() {
        return myNumber;
    };
    this.getSuit = function() {
        return mySuit;
    };
    this.getValue = function() {
        if(myNumber > 10) {
            // face cards count 10
            return 10;
        } else if(myNumber === 1) {
            // Ace counts 11
            return 11;
        }
        return myNumber;
    };
    
    this.printCard = function() {
        var rank = myNumber, suit = suits[mySuit];
        if(ranks.hasOwnProperty(rank)) {
            rank = ranks[rank];
        }
        return rank + " of " + suit;
    };

    this.displayCard = function() {
        return "<div class='card cardValue-" + mySuit + "-" + myNumber + "'></div>";
    };
}

function Deck() {
    var numCards, deck;
    
    function init() {
        var numSuits = 4, suit,
            numRanks = 13, rank;
        deck = [];
        for(suit = 1; suit <= numSuits; suit++) {
            for(rank = 1; rank <= numRanks; rank++) {
                deck.push(new Card(suit,rank));
            }
        }
        numCards = numSuits * numRanks;
    }
    
    init();
    
    this.deal = function() {
        var index, card;
        if(numCards === 0) {
            // "shuffle" the deck
            init();
        }
        index = Math.floor(Math.random() * numCards);
        card = deck.splice(index,1)[0];
        numCards--;
        return card;
    };
    
    this.remainingCards = function() {
        return numCards;
    };
    
}

function Hand(deck) {
    var cards = [], myDeck = deck;
    
    cards.push(myDeck.deal());
    cards.push(myDeck.deal());
    
    this.getHand = function() {
        return cards;
    };
    
    this.score = function() {
        var i, len = cards.length, score = 0, cardValue, aces = 0;
        for(i = 0; i < len; i++) {
            cardValue = cards[i].getValue();
            if(cardValue === 11) {
                aces++;
            }
            score += cardValue;
        }
        while(score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    };
    
    this.printHand = function() {
        var handStr = cards.map(function(card) {
            return card.printCard();
        }), result, score = this.score(), blackjack;
        result = handStr.join(", ") + " (score " + score + ")";
        if(this.hasBlackjack()) {
            result += "\nBlackjack!";
        }
        return result;
        
    };

    this.displayHand = function() {
        var hand = cards.map(function(card) {
            return card.displayCard();
        });
        return hand.join("");
    };
    
    this.hitMe = function() {
        var newCard = myDeck.deal();
        cards.push(newCard);
        return newCard;
    };
    
    this.hasBlackjack = function() {
        // blackjack is an ace and a jack
        var i, len = cards.length, rank, ace = false, jack = false;
        if(len === 2) {
            for(i = 0; i < len; i++) {
                rank = cards[i].getNumber();
                if(rank === 1) {
                    ace = true;
                } else if (rank === 11) {
                    jack = true;
                }
            }
        }
        return ace && jack;
    };
}

function Game() {
    var game = this, deck, userHand, dealerHand, hands, wins, losses, ties, summary, state;

    /** 
     * Encapsulate display updates
     */
    function update() {
        if(state.phase === "user") {
            // user is playing
            $("#actions, #actions .play, #current_hand").show();
            $("#cards")
                .html(userHand.displayHand());
            $("#score")
                .html(userHand.printHand());
            $("#actions .replay").hide();
        } else if(state.phase === "endHand") {
            // show results
            $("#actions .replay").show();
            $("#actions .play").hide();
                $("#hands").html(Mustache.render("                \
                {{#hands}}                         \
                <li class='{{winnerClass}}'>                                            \
                    <div class='winner'>Result: {{winner}}</div>        \
                    <div class='hand user'>User: {{user}}</div>       \
                    <div class='hand dealer'>Dealer: {{dealer}}</div>   \
                </li>                                                   \
                {{/hands}}", {
                    "hands": state.previous_hands.slice().reverse()
                }));
            $("#results").html(summary);
        } else if(state.phase === "newGame") {
            $("#hands, #results, #cards, #score").empty();
        }
    }

    function playAsDealer() {
        var hand = new Hand(deck);
        while(hand.score() < 17) {
            hand.hitMe();
        }
        return hand;
    }

    // TODO: messy
    function declareWinner() {
        var userScore = userHand.score(),
            dealerScore = dealerHand.score(),
            userBlackjack = userHand.hasBlackjack(),
            dealerBlackjack = dealerHand.hasBlackjack();
        if(userScore > 21) {
            // user busts
            if(dealerScore > 21) {
                return "You tied!";
            } else {
                return "You lose!";
            }
        } else if(dealerScore > 21) {
            // dealer busts
            return "You win!";
        } else if(userScore > dealerScore) {
            return "You win!";
        } else if(userScore === dealerScore) {
            if(userBlackjack && !dealerBlackjack) {
                return "You win!";
            } else if(dealerBlackjack) {
                return "You lose!";
            }
            return "You tied!";
        } else {
            return "You lose!";
        }
    }

    this.startHand = function() {
        state.phase = "user";
        userHand = new Hand(deck);
        if(userHand.score() > 21) {
            game.endHand();
        }
        
        update();
    };

    this.hit = function() {
        userHand.hitMe();
        if(userHand.score() > 21) {
            game.endHand();
        } else {
            update();
        }
    }

    this.endHand = function() {
        state.phase = "endHand";
        dealerHand = playAsDealer(deck);
        
        result = {
            "user": userHand.printHand(),
            "dealer": dealerHand.printHand(),
            "winner": declareWinner(),
        };

        // TODO: messy
        switch(result.winner) {
            case "You win!":
                wins++;
                result.winnerClass = "win";
                break;
            case "You lose!":
                losses++;
                result.winnerClass = "lose";
                break;
            default:
                ties++;
                result.winnerClass = "tie";
                break;
        }
        
        // TODO: messy
        summary = "Results (W/L/D): " + [wins,losses,ties].join("/");
        state.previous_hands.push(result);
        update();
    };

    this.init = function() {
        // todo: localize tallies to endgame
        wins = 0;
        losses = 0;
        ties = 0;

        deck = new Deck();
        
        state = {
            "current_hand": null,
            "previous_hands": [],
            "phase": "newGame"
        }
        update();

        game.startHand();
    };



    game.init();
}

// jQuery hooks
var game = new Game();

$("#new_game").click(game.init);
$("#hit").click(game.hit);
$("#stay").click(game.endHand);
$("#replay").click(game.startHand);