export type Player = {
  name: string;
  tag: string;
  discordId: string;
};

export const PLAYERS: Player[] = [
  { name: 'Barry', tag: '24081', discordId: '410258026608459786' },
  { name: 'Tarikk', tag: 'LAS', discordId: '536261498276937749' },
  { name: 'Bloodme', tag: 'LAS', discordId: '1079568485052579950' },
  { name: 'DakaH', tag: 'Saiko', discordId: '355153243036188682' },
  { name: 'Disprezz', tag: 'LAS', discordId: '436304189447077888' },
  { name: 'Wachumeiket', tag: 'LAS', discordId: '471115606092021763' },
  { name: 'Jamie Tarttッ', tag: '999', discordId: '303957248420347905' },
  { name: 'Nube', tag: 'HXC', discordId: '1098233238859821076' },
];

export const getRiotId = (player: Pick<Player, 'name' | 'tag'>) =>
  `${player.name}#${player.tag}`;
