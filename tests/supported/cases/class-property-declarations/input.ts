class Handler {
  #handle = (e: Event) => {
    if (e instanceof CustomEvent && !e.detail.handled) {
      const { data }: CustomEventDetail = e.detail;
    }
  };
  handle = (e: Event) => {
    if (e instanceof CustomEvent && !e.detail.handled) {
      const { data }: CustomEventDetail = e.detail;
    }
  };
}
