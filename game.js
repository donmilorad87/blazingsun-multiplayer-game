const express = require('express')
const app = express()
const port = 8080
const http = require('http').Server(app)
const io = require('socket.io')(http)
const lodash = require('lodash')

let players = []
let round = 0
let game = []

app.use(express.static(__dirname+'/public'))

app.get('/game/:gameid',function(req,res){
    res.redirect('/game.html?gameId=' + req.params.gameid)
    
    
})


http.listen(port,function(){
    console.log('ready')
})

io.on('connection', function(socket){
    let userID
    let gameHelper
    let gameHelper2
    let index = null
    let index2 = null

    socket.on('gameId', function(gameid,id,name){
    
        if(game.length>0){
            for(let i = 0; i<game.length;i++){
                if(game[i].gameid === gameid){
                    console.log('ovde smo1')
                    index = i
                    
                }
            }
            if(index !== null){
                if(game[index].players.length < 4){
                    for(let i=0; i<game[index].players.length;i++){
                        if(game[index].players[i].id === id){
                            index2 = i
                        }
                    }
                    if(index2 !== null){
                        console.log('vec ste u igri')
                    }else{
                        console.log('jebarnica')
                        gameHelper2 = {"name":name,"id":id,'active':true}
                        game[index].players.push(gameHelper2)
                        gameHelper = game[index]
                    } 
                }
                else{
                    console.log('puna je partija', JSON.stringify(game))
                }
                    
            }
            else{
                gameHelper2 = {"name":name,"id":id,"admin":true,'active':true}
                gameHelper = {"gameid":gameid, "players":[gameHelper2]}
                game.push(gameHelper)
            }

            

        }
        else{
            gameHelper2 = {"name":name,"id":id,"admin":true,'active':true}
            gameHelper = {"gameid":gameid, "players":[gameHelper2]}
            game.push(gameHelper)
            
        }
        
        io.emit('game', gameHelper) 
        
     })

    socket.on('new player', function(id,name){
        userID = {
            name: name,
            id: id,
            round: round,
            roll: null,
            winner: false
        }
        players.push(userID)
        io.emit('players', players)  
    })

    socket.on('disconnect', function(reason){

        players = players.filter(function(obj){
            return obj !== userID
        })
        console.log(gameHelper, gameHelper2)
        io.emit('game', gameHelper) 
        io.emit('players', players)
    })
    socket.on('roll', function(){
        userID.roll = lodash.random(1,1000)
        console.log(userID)
        io.emit('players', players)
        nextRoundCheck()
    })
    io.emit('players', players)
})

function nextRoundCheck(){
    if(players.length > 0){
        let ready = 0
        let top = 0
        let win = 0

        players.forEach(function(player,index){
            player.winner = false
            if(player.roll){
                ready++
                if(player.roll && player.roll > top){
                    win = index
                    top = player.roll        
                }
            }
        })
        players[win].winner = true
        io.emit('players', players)
        if(ready >= players.length){
            io.emit('inplay','Round #' +round+ 'winner is '+ players[win].name)
            round++
            players.forEach(function(player,index){
                player.winner = false
                player.roll = null
                player.round = round
            })
        }
    }
}