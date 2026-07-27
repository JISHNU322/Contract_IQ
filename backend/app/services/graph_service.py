import networkx as nx
from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.contract_entity import ContractEntity
from app.models.contract_clause_label import ContractClauseLabel
from app.models.contract_chunk import ContractChunk


class GraphService:
    def build_contract_graph(self, db: Session, contract_id: int) -> dict:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return {"nodes": [], "edges": []}

        G = nx.DiGraph()

        contract_node_id = f"contract_{contract.id}"
        G.add_node(contract_node_id, label=contract.filename, type="Contract")

        # Entities connected to this contract
        entities = db.query(ContractEntity).filter(ContractEntity.contract_id == contract_id).all()
        for entity in entities:
            entity_node_id = f"entity_{entity.id}"
            G.add_node(entity_node_id, label=entity.entity_text, type=entity.entity_type)
            G.add_edge(contract_node_id, entity_node_id, relation="MENTIONS")

        # Clause labels connected via chunks
        chunks = db.query(ContractChunk).filter(ContractChunk.contract_id == contract_id).all()
        for chunk in chunks:
            labels = db.query(ContractClauseLabel).filter(ContractClauseLabel.chunk_id == chunk.id).all()
            for label in labels:
                clause_node_id = f"clause_{label.id}"
                G.add_node(clause_node_id, label=label.clause_type, type="Clause")
                G.add_edge(contract_node_id, clause_node_id, relation="HAS_CLAUSE")

        return self._serialize_graph(G)

    def build_global_graph(self, db: Session, user_id: int, user_role: str) -> dict:
        """
        Builds a graph across ALL contracts the user can access, showing
        shared entities (e.g., the same vendor appearing in multiple contracts).
        """
        query = db.query(Contract)
        if user_role not in ["admin", "legal_reviewer"]:
            query = query.filter(Contract.uploaded_by_id == user_id)
        contracts = query.all()

        G = nx.DiGraph()
        entity_text_to_node = {}  # dedupe shared entities like the same vendor name

        for contract in contracts:
            contract_node_id = f"contract_{contract.id}"
            G.add_node(contract_node_id, label=contract.filename, type="Contract")

            entities = db.query(ContractEntity).filter(ContractEntity.contract_id == contract.id).all()
            for entity in entities:
                key = (entity.entity_type, entity.entity_text.lower().strip())
                if key not in entity_text_to_node:
                    entity_node_id = f"entity_{len(entity_text_to_node)}"
                    entity_text_to_node[key] = entity_node_id
                    G.add_node(entity_node_id, label=entity.entity_text, type=entity.entity_type)
                G.add_edge(contract_node_id, entity_text_to_node[key], relation="MENTIONS")

        return self._serialize_graph(G)

    def _serialize_graph(self, G: nx.DiGraph) -> dict:
        nodes = [
            {"id": node_id, "label": data["label"], "type": data["type"]}
            for node_id, data in G.nodes(data=True)
        ]
        edges = [
            {"source": u, "target": v, "relation": data["relation"]}
            for u, v, data in G.edges(data=True)
        ]
        return {"nodes": nodes, "edges": edges}


graph_service = GraphService()