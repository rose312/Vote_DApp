"use strict";

var Candidate = function() {
    this.name = "";
    this.number = 0;
}

var Vote = function(text){
    this.name = "";
    this.sTime = "";
    this.eTime = "";
    this.author = "";
    this.candidateNumber = new BigNumber(0);
};


var VoteContract = function () {
    LocalContractStorage.defineMapProperty(this, "voteMap");
    LocalContractStorage.defineMapProperty(this, "candidateMap");
    LocalContractStorage.defineProperty(this, "voteSize");
    LocalContractStorage.defineProperty(this, "candidateSize");
};

VoteContract.prototype = {
    init: function() {
        this.voteSize = 0;
        this.candidateSize = 0;
    },

    getState: function(sTime, eTime) {
        var nowDate = new Date();     
        var year = nowDate.getFullYear();    
        var month = nowDate.getMonth() + 1 < 10 ? "0" + (nowDate.getMonth() + 1) : nowDate.getMonth() + 1;    
        var day = nowDate.getDate() < 10 ? "0" + nowDate.getDate() : nowDate.getDate();    
        var time = year + "-" + month + "-" + day;
        if (time < sTime) {
            return -1;
        }
        else if (time > eTime) {
            return 1;
        }
        return 0;
    },

    getAll: function() {
        var result = [];
        for(var i=0; i<this.voteSize; i++){
            var vote = this.voteMap.get(i);
            var candidateArray = [];
            for(var j = 0; j < vote.candidateNumber; j++){
                var temp = {
                    key: i + "_" + j,
                    value: this.candidateMap.get(i + "_" + j)
                };
                candidateArray.push(temp);
            }
            var temp = {
                key: i,
                state: this.getState(vote.sTime, vote.eTime),
                vote: vote,
                candidates: candidateArray
            };
            result.push(temp);
        }
        return result;
    },

    save: function(name, sTime, eTime, candidates) {
        name = name.trim();
        sTime = sTime.trim();
        eTime = eTime.trim();
        candidates = candidates.trim();
        if (name == "" || sTime == "" || eTime == "" || candidates == "") {
            throw new Error(" empty value");
        }
        var from = Blockchain.transaction.from;

        var index = this.voteSize;
        var candidateArray = candidates.split(";");
        var vote = new Vote();
        vote.name = name;
        vote.author = from;
        vote.sTime = sTime;
        vote.eTime = eTime;
        vote.candidateNumber = new BigNumber(candidateArray.length - 1);
        this.voteMap.set(index, vote);
        this.voteSize += 1;      
        
        for(var i = 0; i < vote.candidateNumber; i++) {
            var candidate = new Candidate();
            candidate.name = candidateArray[i];
            this.candidateMap.set(index + "_" + i, candidate);
            this.candidateSize += 1;
        }
        
    },

    update: function (key1, key2) { 
        key1 = key1.trim();
        key2 = key2.trim();
        if(key1 == "" || key2 == ""){
            throw new Error("empty key");
        } 
        var vote = this.voteMap.get(key1);
        if(!vote) {
            throw new Error("no such vote");
        }
        var state = this.getState(vote.sTime, vote.eTime);
        if (state < 0) {
            throw new Error("vote is pending");
        }
        if (state > 0) {
            throw new Error("vote has ended");
        }

        var candidate = this.candidateMap.get(key2);
        if (!candidate) {
            throw new Error("no such candidate");
        }
        candidate.number += 1;
        this.candidateMap.set(key2, candidate);
    }
};

module.exports = VoteContract;