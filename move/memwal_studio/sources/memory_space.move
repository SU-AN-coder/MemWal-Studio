/// Module: memory_space
/// Provides on-chain memory namespace ownership and access governance
/// for MemWal Studio. Walrus stores the data; Sui proves who controls
/// the namespace and who has access.
module memwal_studio::memory_space {
    use std::ascii::{Self, String};
    use std::bcs;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};

    // ============================================================
    // Error Codes
    // ============================================================

    const E_NOT_OWNER: u64 = 0;
    const E_GRANT_REVOKED: u64 = 2;
    const E_PERMISSION_DENIED: u64 = 4;
    const E_INVALID_PERMISSION: u64 = 5;

    // ============================================================
    // Permission enum values
    // ============================================================

    const PERMISSION_READ: u8 = 1;
    const PERMISSION_WRITE: u8 = 2;
    const PERMISSION_ADMIN: u8 = 3;

    // ============================================================
    // Objects
    // ============================================================

    /// A MemorySpace proves namespace ownership on Sui.
    /// It points to the initial Walrus index blob.
    public struct MemorySpace has key, store {
        id: UID,
        name: String,
        owner: address,
        walrus_index_blob_id: String,
        created_at_ms: u64,
    }

    /// An AccessGrant proves that an agent address has permission
    /// to access a memory space. It can be revoked.
    public struct AccessGrant has key, store {
        id: UID,
        space_id: address,
        agent: address,
        permission: u8,
        granter: address,
        is_revoked: bool,
        granted_at_ms: u64,
        expires_at_ms: u64,
        revoked_at_ms: u64,
    }

    // ============================================================
    // Events
    // ============================================================

    /// Emitted when a new memory space is created
    public struct MemorySpaceCreated has copy, drop {
        space_id: address,
        owner: address,
        name: String,
        walrus_index_blob_id: String,
        created_at_ms: u64,
    }

    /// Emitted when access is granted
    public struct AccessGranted has copy, drop {
        grant_id: address,
        space_id: address,
        agent: address,
        granter: address,
        permission: u8,
        granted_at_ms: u64,
        expires_at_ms: u64,
    }

    /// Emitted when access is revoked
    public struct AccessRevoked has copy, drop {
        grant_id: address,
        space_id: address,
        agent: address,
        revoked_at_ms: u64,
    }

    /// Emitted when seal_approve checks a policy
    public struct SealApprovalChecked has copy, drop {
        space_id: address,
        grant_id: address,
        requester: address,
        permission: u8,
        approved: bool,
        checked_at_ms: u64,
    }

    // ============================================================
    // Public Functions
    // ============================================================

    /// Create a new memory space. Returns the MemorySpace object.
    public fun create_space(
        name: vector<u8>,
        walrus_index_blob_id: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        let space = MemorySpace {
            id: object::new(ctx),
            name: ascii::string(name),
            owner: sender,
            walrus_index_blob_id: ascii::string(walrus_index_blob_id),
            created_at_ms: timestamp,
        };

        let space_id = object::uid_to_address(&space.id);

        event::emit(MemorySpaceCreated {
            space_id,
            owner: sender,
            name: ascii::string(name),
            walrus_index_blob_id: ascii::string(walrus_index_blob_id),
            created_at_ms: timestamp,
        });

        transfer::public_transfer(space, sender);
    }

    /// Grant access to a memory space. The AccessGrant is shared so Seal
    /// key-server dry-runs can read it from the requesting agent's PTB.
    public fun grant_access(
        space: &MemorySpace,
        agent: address,
        permission: u8,
        expires_at_ms: u64,
        ctx: &mut TxContext,
    ) {
        assert!(
            permission == PERMISSION_READ ||
            permission == PERMISSION_WRITE ||
            permission == PERMISSION_ADMIN,
            E_INVALID_PERMISSION
        );

        let sender = tx_context::sender(ctx);
        assert!(sender == space.owner, E_NOT_OWNER);

        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        let grant = AccessGrant {
            id: object::new(ctx),
            space_id: object::uid_to_address(&space.id),
            agent,
            permission,
            granter: sender,
            is_revoked: false,
            granted_at_ms: timestamp,
            expires_at_ms,
            revoked_at_ms: 0,
        };

        let grant_id = object::uid_to_address(&grant.id);

        event::emit(AccessGranted {
            grant_id,
            space_id: object::uid_to_address(&space.id),
            agent,
            granter: sender,
            permission,
            granted_at_ms: timestamp,
            expires_at_ms,
        });

        transfer::share_object(grant);
    }

    /// Revoke an access grant
    public fun revoke_access(
        grant: &mut AccessGrant,
        ctx: &TxContext,
    ) {
        assert!(!grant.is_revoked, E_GRANT_REVOKED);
        assert!(tx_context::sender(ctx) == grant.granter, E_NOT_OWNER);

        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        grant.is_revoked = true;
        grant.revoked_at_ms = timestamp;

        event::emit(AccessRevoked {
            grant_id: object::uid_to_address(&grant.id),
            space_id: grant.space_id,
            agent: grant.agent,
            revoked_at_ms: timestamp,
        });
    }

    /// Seal-compatible approval policy function.
    /// The first parameter must be the requested identity bytes, as required by
    /// Seal key servers. The function aborts when access is denied.
    /// Approval requires:
    /// - The requested identity bytes match the grant's space id
    /// - The transaction sender matches the grant agent
    /// - The permission is sufficient (admin >= write >= read)
    /// - The grant is not revoked
    /// - The grant has not expired
    public entry fun seal_approve(
        id: vector<u8>,
        grant: &AccessGrant,
        requested_permission: u8,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let requester = tx_context::sender(ctx);
        let now_ms = clock::timestamp_ms(clock);
        let approved = is_approved_at(id, grant, requester, requested_permission, now_ms);

        event::emit(SealApprovalChecked {
            space_id: grant.space_id,
            grant_id: object::uid_to_address(&grant.id),
            requester,
            permission: requested_permission,
            approved,
            checked_at_ms: now_ms,
        });

        assert!(approved, E_PERMISSION_DENIED);
    }

    fun is_approved_at(
        id: vector<u8>,
        grant: &AccessGrant,
        requester: address,
        requested_permission: u8,
        now_ms: u64,
    ): bool {
        // Seal identity must match this grant's memory space id.
        if (id != bcs::to_bytes(&grant.space_id)) {
            return false
        };

        // Requester must match the grant agent
        if (grant.agent != requester) {
            return false
        };

        // Grant must not be revoked
        if (grant.is_revoked) {
            return false
        };

        // Grant must not be expired (0 means no expiry)
        if (grant.expires_at_ms != 0 && grant.expires_at_ms < now_ms) {
            return false
        };

        // Permission must be sufficient
        if (grant.permission < requested_permission) {
            return false
        };

        true
    }

    // ============================================================
    // Getter Functions
    // ============================================================

    public fun get_owner(space: &MemorySpace): address {
        space.owner
    }

    public fun get_name(space: &MemorySpace): String {
        space.name
    }

    public fun is_revoked(grant: &AccessGrant): bool {
        grant.is_revoked
    }

    public fun is_expired(grant: &AccessGrant, clock: &Clock): bool {
        grant.expires_at_ms != 0 && grant.expires_at_ms < clock::timestamp_ms(clock)
    }

    // ============================================================
    // Tests
    // ============================================================

    #[test]
    fun test_create_space() {
        use sui::test_scenario::{Self, Scenario};

        let owner = @0xA;
        let mut scenario = test_scenario::begin(owner);
        {
            test_scenario::next_tx(&mut scenario, owner);
            create_space(
                b"overflow-agent-research",
                b"walrus_blob_idx_abc123",
                test_scenario::ctx(&mut scenario),
            );
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_grant_and_revoke() {
        use sui::test_scenario::{Self, Scenario};

        let owner = @0xA;
        let agent = @0xB;
        let mut scenario = test_scenario::begin(owner);

        // Create space
        {
            test_scenario::next_tx(&mut scenario, owner);
            create_space(
                b"test-space",
                b"blob_idx_001",
                test_scenario::ctx(&mut scenario),
            );
        };

        // Grant access
        {
            test_scenario::next_tx(&mut scenario, owner);
            let space = test_scenario::take_from_sender<MemorySpace>(&scenario);
            grant_access(
                &space,
                agent,
                PERMISSION_READ,
                0, // no expiry
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, space);
        };

        // Revoke access
        {
            test_scenario::next_tx(&mut scenario, owner);
            let mut grant = test_scenario::take_shared<AccessGrant>(&scenario);
            assert!(!is_revoked(&grant), 0);
            revoke_access(&mut grant, test_scenario::ctx(&mut scenario));
            assert!(is_revoked(&grant), 0);
            test_scenario::return_shared(grant);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_seal_approve_flow() {
        use sui::test_scenario::{Self, Scenario};

        let owner = @0xA;
        let agent = @0xB;
        let stranger = @0xC;
        let mut scenario = test_scenario::begin(owner);

        // Create space
        {
            test_scenario::next_tx(&mut scenario, owner);
            create_space(
                b"seal-test",
                b"idx_seal",
                test_scenario::ctx(&mut scenario),
            );
        };

        // Grant read access
        {
            test_scenario::next_tx(&mut scenario, owner);
            let space = test_scenario::take_from_sender<MemorySpace>(&scenario);
            grant_access(
                &space,
                agent,
                PERMISSION_READ,
                0,
                test_scenario::ctx(&mut scenario),
            );
            test_scenario::return_to_sender(&scenario, space);
        };

        // Check: agent should be approved
        {
            test_scenario::next_tx(&mut scenario, owner);
            let space = test_scenario::take_from_sender<MemorySpace>(&scenario);
            let grant = test_scenario::take_shared<AccessGrant>(&scenario);
            let space_id = object::uid_to_address(&space.id);

            // Agent B should be approved
            assert!(
                is_approved_at(bcs::to_bytes(&space_id), &grant, agent, PERMISSION_READ, 0),
                0
            );
            // Stranger should NOT be approved
            assert!(
                !is_approved_at(bcs::to_bytes(&space_id), &grant, stranger, PERMISSION_READ, 0),
                0
            );

            test_scenario::return_to_sender(&scenario, space);
            test_scenario::return_shared(grant);
        };

        // Revoke and check denial
        {
            test_scenario::next_tx(&mut scenario, owner);
            let space = test_scenario::take_from_sender<MemorySpace>(&scenario);
            let mut grant = test_scenario::take_shared<AccessGrant>(&scenario);
            let space_id = object::uid_to_address(&space.id);

            // Revoke
            revoke_access(&mut grant, test_scenario::ctx(&mut scenario));

            // After revoke, agent should be denied
            assert!(
                !is_approved_at(bcs::to_bytes(&space_id), &grant, agent, PERMISSION_READ, 0),
                0
            );

            test_scenario::return_to_sender(&scenario, space);
            test_scenario::return_shared(grant);
        };

        test_scenario::end(scenario);
    }
}
