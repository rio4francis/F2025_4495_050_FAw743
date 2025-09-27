export type Category = {
  id: string;
  name: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "reusables",
    name: "Reusable Goods",
    description: "Bottles, cups, lunch boxes, and bags to reduce single-use plastics."
  },
  {
    id: "eco-packaging",
    name: "Eco Packaging",
    description: "Compostable or recyclable packaging alternatives for daily use."
  },
  {
    id: "energy-saving",
    name: "Energy-Saving Devices",
    description: "LED bulbs, smart plugs, and home efficiency upgrades to cut power usage."
  },
];
