var last = null;
var genie_env = new genie.Environment();
var search = {active:true, currentWindow: true};

function incr() {
    var count = Number.parseInt(localStorage.getItem('total_hits')) || 0;
    localStorage.setItem('total_hits', count + 1);
}
incr();
genie_env.create_template('sig', '@graham');

var fake_results = ['Aardvark', 'Albatross', 'Alligator', 'Alpaca', 'Ant', 'Anteater', 'Antelope', 'Ape', 'Armadillo', 'Baboon', 'Badger', 'Barracuda', 'Bat', 'Bear', 'Beaver', 'Bee', 'Bison', 'Boar', 'Buffalo', 'Butterfly', 'Camel', 'Capybara', 'Caribou', 'Cassowary', 'Cat', 'Caterpillar', 'Chamois', 'Cheetah', 'Chicken', 'Chimpanzee', 'Chinchilla', 'Chough', 'Clam', 'Cobra', 'Cockroach', 'Cod', 'Cormorant', 'Coyote', 'Crab', 'Crane', 'Crocodile', 'Crow', 'Curlew', 'Deer', 'Dinosaur', 'Dog', 'Dogfish', 'Dolphin', 'Donkey', 'Dotterel', 'Dove', 'Dragonfly', 'Duck', 'Dugong', 'Dunlin', 'Eagle', 'Echidna', 'Eel', 'Eland', 'Elephant', 'Elephantseal', 'Elk', 'Emu', 'Falcon', 'Ferret', 'Finch', 'Fish', 'Flamingo', 'Fly', 'Fox', 'Frog', 'Gaur', 'Gazelle', 'Gerbil', 'GiantPanda', 'Giraffe', 'Gnat', 'Gnu', 'Goat', 'Goldfish', 'Goose', 'Gorilla', 'Goshawk', 'Grasshopper', 'Grouse', 'Guanaco', 'Guineapig', 'Gull', 'Hamster', 'Hare', 'Hawk', 'Hedgehog', 'Heron', 'Herring', 'Hippopotamus', 'Hornet', 'Horse', 'Human', 'Hummingbird', 'Hyena', 'Ibex', 'Ibis', 'Jackal', 'Jaguar', 'Jay', 'Bluejay', 'Jellyfish', 'Kangaroo', 'Kingfisher', 'Koala', 'Komododragon', 'Kookabura', 'Kouprey', 'Kudu', 'Lapwing', 'Lark', 'Lemur', 'Leopard', 'Lion', 'Llama', 'Lobster', 'Locust', 'Loris', 'Louse', 'Lyrebird', 'Magpie', 'Mallard', 'Manatee', 'Mandrill', 'Mantis', 'Marten', 'Meerkat', 'Mink', 'Mole', 'Mongoose', 'Monkey', 'Moose', 'Mosquito', 'Mouse', 'Mule', 'Narwhal', 'Newt', 'Nightingale', 'Octopus', 'Okapi', 'Opossum', 'Oryx', 'Ostrich', 'Otter', 'Owl', 'Oyster', 'Panda', 'Panther', 'Parrot', 'Partridge', 'Peafowl', 'Pelican', 'Penguin', 'Pheasant', 'Pig', 'Pigeon', 'PolarBear', 'Pony', 'Porcupine', 'Porpoise', 'PrairieDog', 'Quail', 'Quelea', 'Quetzal', 'Rabbit', 'Raccoon', 'Rail', 'Ram', 'Rat', 'Raven', 'Redpanda', 'Reindeer', 'Rhinoceros', 'Rook', 'Salamander', 'Salmon', 'SandDollar', 'Sandpiper', 'Sardine', 'Scorpion', 'Sealion', 'SeaUrchin', 'Seahorse', 'Seal', 'Shark', 'Sheep', 'Shrew', 'Skunk', 'Snail', 'Snake', 'Sparrow', 'Spider', 'Spoonbill', 'Squid', 'Squirrel', 'Starling', 'Stingray', 'Stinkbug', 'Stork', 'Swallow', 'Swan', 'Tapir', 'Tarsier', 'Termite', 'Tiger', 'Toad', 'Trout', 'Turkey', 'Turtle', 'Viper', 'Vulture', 'Wallaby', 'Walrus', 'Wasp', 'Weasel', 'Whale', 'Wildcat', 'Wolf', 'Wolverine', 'Wombat', 'Woodcock', 'Woodpecker', 'Worm', 'Wren', 'Yak', 'Zebra'];

function run_command(command, sendResponse) {
    console.log("running command: " + command);
    if (command == 'update') {
        var count = (new Date()).getMilliseconds();
        chrome.browserAction.setBadgeText({text: "" + count});
        sendResponse({});
    } else if (command == 'github') {
        var url = "http://github.com/graham/genie";
        chrome.tabs.create({ active:false, url: url });
        sendResponse({});
    } else if (command == 'stat') {
        sendResponse({'results':["author: graham", "email: graham.abbott@gmail.com", "hits: " + localStorage.getItem('total_hits')]});
    } else {
        sendResponse({'error':'Command not found.'});
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.command == 'render-as-template') {
            incr();
            var result = genie.fs(request.content, {"engine":"Genie 0.5"});
            chrome.tabs.query(search, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command:"replace-active-content-with",
                                                     content:result}, function(response) {
                    console.log("sent a result to the main window.");
                });
            });
        } else if (request.command == 'render-active-with-template') {
            incr();
            if (request.template_name && (request.template_name[0] == '!' || request.template_name[0] == "'")) {
                run_command(request.template_name.slice(1), sendResponse);
            } else {
                if (genie_env.template_dict[request.template_name] != undefined) {
                    var result = genie_env.render(request.template_name, {});
                    chrome.tabs.query(search, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {command:"replace-active-content-with",
                                                             content:result}, function(response) {
                            console.log("sent a result to the main window.");
                        });
                    });
                    sendResponse({});
                } else {
                    sendResponse({'error':"No such template."});
                }
            }
        } else if (request.command == 'quick-search') {
            if (request.query.length == 0) {
                sendResponse({"results":[]});
            } else {
                var results = [];

                for(var i = 0; i < fake_results.length; i++) {
                    var row = fake_results[i];
                    row = row.toLowerCase();
                    if (row.slice(0, request.query.length) == request.query) {
                        results.push(fake_results[i]);
                    }
                }
                sendResponse({'results':results});
            }
        } else {
            var url = "http://github.com/graham/genie";
            chrome.tabs.create({ active:false, url: url });
            sendResponse({});
        }
    });

(function() {
	chrome.commands.onCommand.addListener(function(command) {
        if (command == "render-focused-editable") {
            chrome.tabs.query(search, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command: "request-active-content"}, function(response) {
                    console.log("requested content.");
                });
            });
        } else if (command == "open-drawer") {
            chrome.tabs.query(search, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {command: "show-omni-bar"}, function(response) {
                    console.log("Requested Omni bar show for tab: " + tabs[0]);
                });
            });
        }
	});	
})();

console.log("Loaded internal");
