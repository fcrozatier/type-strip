class Handler {
  #handle = (e) => {
    if (e instanceof CustomEvent && !e.detail.handled) {
      const { data } = e.detail;
    }
  };
  handle = (e) => {
    if (e instanceof CustomEvent && !e.detail.handled) {
      const { data } = e.detail;
    }
  };
}
