export type Candidate = {
  id: string;
  name: string;
  fullName: string;
  number: string;
  party: string;
  partyName: string;
  federation: string | null;
  coalition: string;
  uf: string;
  office: number;
  votes: number;
  stateVotes?: number;
  percent: number | null;
  status: string;
  officialStatus: string;
  elected: boolean;
  secondRound: boolean;
  rank: number;
  electedRank: number | null;
  destination: string | null;
  registrationStatus: null;
  round: number;
};
export type Meta = {
  election: string;
  round: number;
  scope: string;
  sections: number;
  counted: number;
  percent: number;
  final: boolean;
  progress: string;
  mathematical: string | null;
  noElected: boolean;
  noElectedReasons: string[];
  sourceTime: string;
  generatedTime: string;
  validVotes: number;
  nominalVotes: number;
  turnout: number;
  abstention: number;
  turnoutPercent: number;
  abstentionPercent: number;
  url: string;
  collectedAt: string;
  sha256: string;
};
export type Party = {
  party: string;
  office: number;
  uf?: string;
  nominal: number;
  legend: number | null;
  total: number;
  percent: number | null;
  elected: number;
  secondRound: number;
  municipalities: number;
  ties: number;
};
export type Result = {
  office: number;
  name: string;
  seats: number;
  candidates: Candidate[];
  parties: Party[];
  meta: Meta;
};
export type OfficeSummary = {
  seats: number;
  elected: number;
  secondRound: number;
  meta: Meta;
  highlights: Candidate[];
  voteLeaders?: Candidate[];
};
export type StateSummary = {
  uf: string;
  name: string;
  municipalities: number;
  ibge: string;
  offices: Record<string, OfficeSummary>;
};
export type State = StateSummary & { results: Record<string, Result> };
export type Municipality = {
  id: string;
  tse: string;
  ibge: string | null;
  name: string;
  uf: string;
  region: string | null;
  capital: boolean;
};
export type Leadership = {
  status: "unique" | "tie" | "pending" | "no_votes";
  leaders: Candidate[];
  meta: Meta;
  officialMeta?: Meta;
};
export type City = Municipality & {
  leaders: Record<string, Leadership>;
  results: Record<
    string,
    { candidates: Candidate[]; meta: Meta; seats: number }
  >;
  partyLeaders: Record<string, { party: string; votes: number }[]>;
};
export type Territory = Municipality & {
  votes: number;
  percent: number | null;
  rank: number | null;
  leader: boolean;
  tie: boolean;
};
export type CandidateDetail = {
  candidate: Candidate;
  cities: Territory[];
  meta: Meta;
  receivedCount: number;
  leaderCount: number;
  tiedCount: number;
  concentration5: number | null;
  concentration10: number | null;
  municipalSum: number;
  consistent: boolean;
};
export type Validation = {
  schema: string;
  coverage: string;
  sampleCities: number;
  sampleStates: number;
  samples?: {
    uf: string;
    city: string;
    office: number;
    status: string;
    votes: number;
    url: string;
  }[];
  aggregationDivergences: { uf: string; office: number; count: number }[];
  ties: Record<string, number>;
  municipalRows: number;
  notes: string[];
};
export type Overview = {
  settings: {
    executiveRound?: number;
    date: string;
    poll: string;
    offices: Record<string, string>;
    secondRoundDate: string | null;
  };
  president: Result;
  states: StateSummary[];
  counts: Record<string, number>;
  pending: { uf: string; office: number }[];
  municipalities: number;
  candidates: number;
  municipalRows: number;
  partySummary: Party[];
  validation: Validation;
  collectionStart: string;
  collectionEnd: string;
  builtAt: string;
  governorsElected: number;
  governorsSecondRound: number;
  governorsPending?: number;
};
export type Snapshot = {
  municipalVotes?: boolean;
  version: string;
  base: string;
  ufs: number;
  municipalities: number;
  candidates: number;
  municipalRows: number;
  validated: boolean;
  collectedAt: string;
  builtAt: string;
  partial: boolean;
  aggregationDivergences: number;
};
export type MunicipalVotes = Municipality & {
  results: Record<string, { candidates: Candidate[]; meta: Meta; officialMeta: Meta }>;
};
export type PartyTerritory = {
  party: string;
  office: number;
  uf: string;
  municipality: string;
  cityId: string;
  candidate: string;
  candidateId: string;
  votes: number;
  tie: boolean;
};
export type MapData = {
  viewBox: string;
  paths: { id: string; d: string; uf?: string; name?: string }[];
  source: { url: string; collectedAt: string };
};
