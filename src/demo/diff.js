import React from "../react";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      count: 0,
    };
  }

  render() {
    const isEven = this.state.count % 2 === 0;
    const arr = isEven ? ["A", "B", "C", "D"] : ["A", "C", "B", "D", "E"];

    return (
      <div>
        <h1>count:{this.state.count}</h1>
        {arr.map((item) => (
          <h1 key={item}>{item}</h1>
        ))}
        <button
          onClick={() => {
            this.setState({ count: this.state.count + 1 });
          }}
        >
          click
        </button>
      </div>
    );
  }
}
