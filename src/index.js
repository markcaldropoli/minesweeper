import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props)
{
    var className = props.value === null ? "square" : "clicked";
    
    return (
        <button id={props.num} className={className} onClick={props.onClick} onContextMenu={props.onContextMenu}>
            {props.value}
        </button>
    );
}

class Board extends React.Component
{
    renderSquare(i)
    {
        return (
            <Square
                key={i} // Keeps track of array index for mapping
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
                onContextMenu={() => this.props.onContextMenu(i)}
                num={i}
            />
        );
    }
  
    render()
    {
        let rows = [];
        // Generate index for rows 0 - 15
        let rowNums = Array.from(Array(16).keys());

        rowNums.forEach((_item,index) => {
            let row = [];
            // Generate numbers for each square in the row (30 squares, 0 - 29, offset by row index * 30)
            let nums = Array.from(Array(30).keys(), n => n + (index * 30));

            // Generate squares for the row
            nums.forEach((item) => {
                row.push(this.renderSquare(item));
            });

            rows.push(row);
        });

        // Map rows to board-row divs to create the board
        return (<div>{rows.map((row,index) => <div key={index} className="board-row">{row}</div>)}</div>)
    }
}

class Game extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state =
        {
            history:
            [
                {
                    squares: Array(480).fill(null),
                }
            ],
            mines: Array(480).fill(null),
            minesInProximity: Array(480).fill(null),
            stepNumber: 0,
            isFirstClick: true,
            isFirstRender: true,
            flagsRemaining: 99
        };

        // Generate mine locations
        var mines = [];

        while (mines.length !== 99)
        {
            const rand = Math.floor(Math.random() * 479);

            if (!mines.includes(rand))
            {
                mines.push(rand);
            }
        }

        // Place mines
        for (let i = 0; i < mines.length; i++)
        {
            this.state.mines[mines[i]] = "💣";
        }

        // Determine mines in proximity
        for (let i = 0; i < this.state.history[0].squares.length; i++)
        {
            // Skip if mine
            if (this.state.mines[i] === "💣") continue;

            var count = 0;
            var above = i - 30;
            var below = i + 30;
            var leftEdge = i % 30 === 0 ? true : false;
            var rightEdge = i % 30 === 29 ? true : false;

            // Check cells above
            if (above >= 0)
            {
                if (!leftEdge && this.state.mines[above-1] === "💣") count++;
                if (this.state.mines[above] === "💣") count++;
                if (!rightEdge && this.state.mines[above+1] === "💣") count++;
            }

            // Check cells on side
            if (!leftEdge && this.state.mines[i-1] === "💣") count++;
            if (!rightEdge && this.state.mines[i+1] === "💣") count++;

            // Check cells below
            if (below <= 479)
            {
                if (!leftEdge && this.state.mines[below-1] === "💣") count++;
                if (this.state.mines[below] === "💣") count++;
                if (!rightEdge && this.state.mines[below+1] === "💣") count++;
            }

            if (count !== 0) this.state.minesInProximity[i] = count;
            else this.state.minesInProximity[i] = "";
        }
    }

    handleClick(i)
    {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        // Skip if square clicked was already clicked
        if (this.state.minesInProximity[i] !== null && squares[i] === this.state.minesInProximity[i]) return;

        // If 💣, the player lost, else display mines in proximity
        if (this.state.mines[i] === "💣")
        {
            // Display all mines on board
            for (let x = 0; x < this.state.mines.length; x++)
            {
                if (this.state.mines[x] !== null)
                {
                    squares[x] = this.state.mines[x];
                }
            }

            // Display all proximity to mines on board
            for (let x = 0; x < this.state.minesInProximity.length; x++)
            {
                if (this.state.minesInProximity[x] !== null)
                {
                    squares[x] = this.state.minesInProximity[x];
                }
            }
        }
        else
        {
            // No 💣, display mines in proximity of clicked square
            squares[i] = this.state.minesInProximity[i];
        }

        this.setState({ 
            history: history.concat([
                { 
                    squares: squares
                }
            ]),
            stepNumber: history.length
        });
    }

    handleRightClick(i)
    {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        let item = squares[i];
        let numFlags = this.state.flagsRemaining;

        if (squares[i] === "🚩")
        {
            numFlags += 1;
            item = null;
        }
        else if(squares[i] === null)
        {
            numFlags -= 1;
            item = "🚩";
        }

        squares[i] = item;

        this.setState({
            flagsRemaining: numFlags,
            history: history.concat([
                { 
                    squares: squares
                }
            ]),
            stepNumber: history.length
        });
    }

    jumpTo(step)
    {
        this.setState({
            stepNumber: step
        });
    }

    render()
    {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(this.state.flagsRemaining,current.squares.slice());

        const moves = history.map((_step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';

            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        let status = 'Select a square!';

        status = winner === "Win" ? 'Amazing, you win!' : winner === "Loss" ? 'Better luck next game!' : 'Select a square!'

        return (
        <div>
            <h1>Minesweeper</h1>
            <h2>Flags Remaining: {this.state.flagsRemaining}/99</h2>
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={(i) => this.handleClick(i)}
                        onContextMenu={(i) => this.handleRightClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{status}</div>
                    <ol>{moves}</ol>
                </div>
            </div>
        </div>
        );
    }
}
  
// ========================================
  
ReactDOM.render(
    <Game />,
    document.getElementById('root'),
    // Add context menu listener to prevent menu opening when player right clicks
    document.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      })
);

function calculateWinner(flagsRemaining, squares)
{
    for (let i = 0; i < squares.length; i++)
    {
        if (squares[i] === "💣") return "Loss";
    }

    return flagsRemaining !== 0 ? "In-Progress" : "Win";
}