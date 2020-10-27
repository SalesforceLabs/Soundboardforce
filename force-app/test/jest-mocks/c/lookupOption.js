import { LightningElement, api } from "lwc";
export default class Lookup extends LightningElement {
  @api item;
  @api activeOption;
  @api searchTerm;
}
