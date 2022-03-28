import {CurveType, Numberu64, TOKEN_SWAP_PROGRAM_ID, TokenSwap} from '@solana/spl-token-swap'
import {
    Keypair,
    PublicKey,
    clusterApiUrl,
    Connection,
    Signer,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Account
} from "@solana/web3.js"
import {
    AccountLayout,
    createAssociatedTokenAccount,
    createMint, mintTo,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token"

const createNewAccount = async (
    connection: Connection,
    lamports: number
) => {
    const keypair = Keypair.generate();
    const signature = await connection.requestAirdrop(keypair.publicKey, lamports);
    await connection.confirmTransaction(signature);
    return keypair;
};

const createNewTokenAccount = async (
    connection: Connection,
    mint: PublicKey,
    owner: Signer
) => {
    return await createAssociatedTokenAccount(
        connection, owner, mint, owner.publicKey
    );
};

const createNewMint = (
    connection: Connection,
    owner: Signer
) => {
    return createMint(
        connection,
        owner,
        owner.publicKey,
        null,
        0,
    );
};
// Pool fees
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;

(async () => {
    // const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const connection = new Connection("http://localhost:8899", "confirmed");
    const poolOwner = await createNewAccount(connection, LAMPORTS_PER_SOL * 10);
    const alice = await createNewAccount(connection, LAMPORTS_PER_SOL * 10);
    const bob = await createNewAccount(connection, LAMPORTS_PER_SOL * 10);

    console.log("Pool owner: ", poolOwner.publicKey.toString());
    console.log("Alice: ", alice.publicKey.toString());
    console.log("Bob: ", bob.publicKey.toString());

    const mintA = await createNewMint(connection, poolOwner);
    const mintB = await createNewMint(connection, poolOwner);
    const mintPool = await createNewMint(connection, poolOwner);

    console.log("Mint A:", mintA.toString());
    console.log("Mint B:", mintB.toString());
    console.log("Mint pool:", mintPool.toString());

    const tokenAccountA = await createNewTokenAccount(connection, mintA, poolOwner);
    const tokenAccountB = await createNewTokenAccount(connection, mintB, poolOwner);
    const tokenAccountPool = await createNewTokenAccount(connection, mintPool, poolOwner);
    // const tokenAccountFee = await createNewTokenAccount(connection, mintPool, poolOwner);
    const tokenAccountFee = tokenAccountPool;
    const tokenSwapAccount = Keypair.generate();
    const [tokenSwapAuthority, _bumpSeed] = await PublicKey.findProgramAddress(
        [tokenSwapAccount.publicKey.toBuffer()],
        TOKEN_SWAP_PROGRAM_ID,
    );

    console.log("Token Account A:", tokenAccountA.toString());
    console.log("Token Account B:", tokenAccountB.toString());
    console.log("Token Account Pool: ", tokenAccountPool.toString());
    console.log("Token Account Fee: ", tokenAccountFee.toString());

    await mintTo(connection, poolOwner, mintA, tokenAccountA, poolOwner, 999);
    await mintTo(connection, poolOwner, mintB, tokenAccountB, poolOwner, 888);

    const tokenSwap: TokenSwap = await TokenSwap.createTokenSwap(
        connection,
        new Account(poolOwner.secretKey),
        new Account(tokenSwapAccount.secretKey),
        tokenSwapAuthority,
        tokenAccountA,
        tokenAccountB,
        mintPool,
        mintA,
        mintB,
        tokenAccountFee,
        tokenAccountPool,
        TOKEN_SWAP_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        TRADING_FEE_NUMERATOR,
        TRADING_FEE_DENOMINATOR,
        OWNER_TRADING_FEE_NUMERATOR,
        OWNER_TRADING_FEE_DENOMINATOR,
        OWNER_WITHDRAW_FEE_NUMERATOR,
        OWNER_WITHDRAW_FEE_DENOMINATOR,
        HOST_FEE_NUMERATOR,
        HOST_FEE_DENOMINATOR,
        CurveType.ConstantPrice,
        new Numberu64(3)
    );
})();