import React from "../react";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      flag: false,
    };
  }

  render() {
    const props = this.state.flag
      ? {
          class: "a",
          style: {
            color: "red",
          },
        }
      : {
          class: "b",
          style: {
            color: "blue",
            "font-size": "20px",
          },
        };

    return (
      <div>
        <h1 {...props}>hello world</h1>
        <button
          onClick={() => {
            this.setState({ flag: !this.state.flag });
          }}
        >
          click
        </button>
      </div>
    );
  }
}
