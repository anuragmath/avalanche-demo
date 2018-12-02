const network = require("../build/network");
const slush = require("../build/slush");
const snowflake = require("../build/snowflake");

const N_NODES = 1000;

class UserContext {
    constructor(name, byzantine) {
        this.name = name;
        this.color = null;
        this.byzantine = byzantine;
        this.sampleSize = 20;
        this.alpha = 0.7;
        this.beta = 15;
        this.messageCount = 0;
    }

    updateColor(color) {
        if (color != this.color) {
            console.log(this.name + ": " + this.color + " -> " + color);
            this.color = color;
        }
    }

    byzantineColor(color) {
        return "!" + color;
    }
}

let nodes = [];

for (let i = 0; i < N_NODES; i++) {
    let byzantine = (i % 5 == 0);
    nodes.push({
        userContext: new UserContext("" + i, byzantine),
    });
}

//let net = new network.Network(nodes, new slush.SlushBuilder());
let net = new network.Network(nodes, new snowflake.SnowflakeBuilder());
net.nodes[0].policy.color = "red";

let n_iter = 0;

setInterval(() => {
    n_iter++;
    net.tick();
    let all_red = true;
    let all_decided = true;
    for (let n of net.nodes) {
        if (n.policy.color != "red") {
            all_red = false;
        }
        if (!n.policy.decided) {
            all_decided = false;
        }
    }
    if (all_red) {
        console.log("All nodes are red.");
    }
    if (all_decided) {
        if (!all_red) {
            console.log("All nodes are decided but some of them are not red - consensus failed!");
            process.exit(1);
        }
        let messageCount = 0;
        for (let n of net.nodes) {
            messageCount += n.config.userContext.messageCount;
        }
        console.log("All " + net.nodes.length + " nodes are decided in " + n_iter + " iterations with a total of " + messageCount + " messages.");
        process.exit(0);
    }
}, 100);