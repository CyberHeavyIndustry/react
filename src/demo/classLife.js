import React from "../react";

class DeleteChild extends React.Component {
  componentDidMount() {
    console.log("componentDidMount delete child");
  }

  componentWillUnmount() {
    console.log("componentWillUnmount delete child");
  }

  render() {
    return <h2>delete child</h2>;
  }
}

class DeleteParent extends React.Component {
  componentDidMount() {
    console.log("componentDidMount delete parent");
  }

  componentWillUnmount() {
    console.log("componentWillUnmount delete parent");
  }

  render() {
    return (
      <div>
        <h1>delete parent</h1>
        <DeleteChild />
      </div>
    );
  }
}

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      count: 0,
    };
  }

  componentDidMount() {
    console.log("componentDidMount App");
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    console.log("getSnapshotBeforeUpdate", prevProps, prevState);
    return 3;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log("componentDidUpdate", prevProps, prevState, snapshot);
  }

  render() {
    return (
      <div>
        {this.state.count === 0 ? <DeleteParent /> : null}
        <h1>count:{this.state.count}</h1>
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
