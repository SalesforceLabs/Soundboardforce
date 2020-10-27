import { LightningElement, api } from "lwc";
export default class Lookup extends LightningElement {
  @api filterList;
  @api skipYourself;
}
