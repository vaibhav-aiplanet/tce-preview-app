declare module "@ruffle-rs/ruffle" {
  interface RufflePlayer extends HTMLElement {
    load(options: { url: string }): void;
  }

  interface Ruffle {
    createPlayer(): Promise<RufflePlayer>;
  }

  const ruffle: Ruffle;
  export default ruffle;
}
