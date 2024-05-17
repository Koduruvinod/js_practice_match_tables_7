const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

//1 get data from player_details
const convertion = obj => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  }
}

const convertionOfmatch = objCh => {
  return {
    matchId: objCh.matchId,
    match: objCh.match,
    year: objCh.year,
  }
}
app.get('/players/', async (request, response) => {
  const player_list = `SELECT * FROM player_details ORDER BY player_id;`
  const responsePlayer_list = await db.all(player_list)
  response.send(responsePlayer_list.map(each => convertion(each)))
})

// 2 get single player by player id
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const player_details = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const player_detailsRes = await db.get(player_details)
  response.send(convertion(player_detailsRes))
})

// 3 update values of the player_table
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const update_quary = `UPDATE 
  player_details 
  SET 
  player_name = '${playerName}'
  WHERE player_id = ${playerId};`
  const response_update_quary = await db.run(update_quary)
  response.send('Player Details Updated')
})
// 4 get match_details based on ID
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const match_details = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const match_details_response = await db.get(match_details)
  response.send(convertionOfmatch(match_details_response))
})
// 5 get match_details with player id
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const get_match_id = `SELECT 
  *
  FROM 
  player_match_score NATURAL JOIN match_details
  WHERE player_id = ${playerId};`
  const match_details_mat_response = await db.all(get_match_id)
  response.send(match_details_mat_response.map(each => convertionOfmatch(each)))
})
//6 get player_details with player id
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const player_details_by_id = `SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName
  FROM player_match_score NATURAL JOIN player_details
  WHERE match_id=${matchId};`
  const player_details_by_id_response = await db.all(player_details_by_id)
  response.send(
    player_details_by_id_response.map(each => convertionOfmatch(each)),
  )
})
// 7 get_data from player_table_score
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const response_of_get = await db.get(getPlayerScored)
  response.send(response_of_get)
})
