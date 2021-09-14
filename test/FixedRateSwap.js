const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { gasspectEVM } = require('./helpers/profileEVM');
const { assertRoughlyEqualValues } = require('./helpers/utils');

const FixedRateSwap = artifacts.require('FixedRateSwap');
const TokenMock = artifacts.require('TokenMock');

contract('FixedFeeSwap', function ([_, wallet1, wallet2]) {
    beforeEach(async function () {
        this.USDT = await TokenMock.new('USDT', 'USDT');
        this.USDC = await TokenMock.new('USDC', 'USDC');
        this.fixedRateSwap = await FixedRateSwap.new(this.USDT.address, this.USDC.address, 'FixedRateSwap', 'FRS', 18);
        await this.fixedRateSwap.transferOwnership(wallet1);
        await this.USDT.mint(wallet1, ether('10'));
        await this.USDT.mint(wallet2, ether('10'));
        await this.USDC.mint(wallet1, ether('10'));
        await this.USDC.mint(wallet2, ether('10'));
        await this.USDT.approve(this.fixedRateSwap.address, ether('10'), { from: wallet1 });
        await this.USDC.approve(this.fixedRateSwap.address, ether('10'), { from: wallet1 });
        await this.USDT.approve(this.fixedRateSwap.address, ether('10'), { from: wallet2 });
        await this.USDC.approve(this.fixedRateSwap.address, ether('10'), { from: wallet2 });
    });

    describe('Deposits', async function () {
        it('should be cheap', async function () {
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            await this.fixedRateSwap.deposit(ether('0.5'), ether('1'), { from: wallet1 });
            await this.fixedRateSwap.deposit(ether('1'), ether('0.5'), { from: wallet1 });
            await this.fixedRateSwap.deposit(ether('1'), ether('0'), { from: wallet1 });
            const receipt = await this.fixedRateSwap.deposit(ether('0'), ether('1'), { from: wallet1 });
            console.log(receipt);
            gasspectEVM(receipt.tx);
        });

        const lpPresicion = ether('0.001');
        it('should mint 1 lp when {balances, deposit} = {(0,100), (0,1)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(0, ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(0,100), (1,0)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), 0, { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(0,100), (1,1)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('2'));
            expect(ether('2').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,0), (0,1)}', async function () {
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(0, ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,0), (1,0)}', async function () {
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), 0, { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,0), (1,1)}', async function () {
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('2'));
            expect(ether('2').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,100), (0,1)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(0, ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,100), (1,0)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), 0, { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('1'));
            expect(ether('1').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should mint 1 lp when {balances, deposit} = {(100,100), (1,1)}', async function () {
            await this.USDC.mint(this.fixedRateSwap.address, ether('100'));
            await this.USDT.mint(this.fixedRateSwap.address, ether('100'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('100'));
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('0'));

            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            const lpBalanceWallet1 = await this.fixedRateSwap.balanceOf(wallet1);
            expect(lpBalanceWallet1).to.be.bignumber.lte(ether('2'));
            expect(ether('2').sub(lpBalanceWallet1)).to.be.bignumber.lt(lpPresicion);
        });

        it('should be denied for zero amount', async function () {
            await expectRevert(
                this.fixedRateSwap.deposit(ether('0'), ether('0'), { from: wallet1 }),
                'Empty deposit is not allowed',
            );
        });

        it('should be allowed for owner', async function () {
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('2'));
        });

        it('should not be allowed for others', async function () {
            await expectRevert(
                this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet2 }),
                'Ownable: caller is not the owner',
            );
        });

        it('should give the same shares for the same deposits', async function () {
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('2'));
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('4'));
        });
    });

    describe('Withdrawals', async function () {
        beforeEach(async function () {
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
        });

        it('should be able to withdraw fully', async function () {
            await this.fixedRateSwap.withdraw(ether('2'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal('0');
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal('0');
            expect(await this.USDT.balanceOf(wallet1)).to.be.bignumber.equal(ether('10'));
            expect(await this.USDC.balanceOf(wallet1)).to.be.bignumber.equal(ether('10'));
        });

        it('should be able to withdraw partially', async function () {
            await this.fixedRateSwap.withdraw(ether('1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('0.5'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('0.5'));
            expect(await this.USDT.balanceOf(wallet1)).to.be.bignumber.equal(ether('9.5'));
            expect(await this.USDC.balanceOf(wallet1)).to.be.bignumber.equal(ether('9.5'));
        });

        it('should be able to withdraw with 1:1', async function () {
            await this.fixedRateSwap.withdrawWithRatio(ether('1'), ether('0.5'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            expect(await this.USDT.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('0.5'));
            expect(await this.USDC.balanceOf(this.fixedRateSwap.address)).to.be.bignumber.equal(ether('0.5'));
            expect(await this.USDT.balanceOf(wallet1)).to.be.bignumber.equal(ether('9.5'));
            expect(await this.USDC.balanceOf(wallet1)).to.be.bignumber.equal(ether('9.5'));
        });

        it('should be able to withdraw with 1:9', async function () {
            await this.fixedRateSwap.withdrawWithRatio(ether('1'), ether('0.1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            assertRoughlyEqualValues(ether('0.9'), await this.USDT.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('0.1'), await this.USDC.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('9.1'), await this.USDT.balanceOf(wallet1), 0.01);
            assertRoughlyEqualValues(ether('9.9'), await this.USDC.balanceOf(wallet1), 0.01);
        });

        it('should be able to withdraw with 9:1', async function () {
            await this.fixedRateSwap.withdrawWithRatio(ether('1'), ether('0.9'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            assertRoughlyEqualValues(ether('0.1'), await this.USDT.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('0.9'), await this.USDC.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('9.9'), await this.USDT.balanceOf(wallet1), 0.01);
            assertRoughlyEqualValues(ether('9.1'), await this.USDC.balanceOf(wallet1), 0.01);
        });

        it('should be able to withdraw with 1:0', async function () {
            await this.fixedRateSwap.withdrawWithRatio(ether('1'), ether('1'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            assertRoughlyEqualValues(ether('0.000107'), await this.USDT.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('1'), await this.USDC.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('10'), await this.USDT.balanceOf(wallet1), 0.01);
            assertRoughlyEqualValues(ether('9'), await this.USDC.balanceOf(wallet1), 0.01);
        });

        it('should be able to withdraw with 0:1', async function () {
            await this.fixedRateSwap.withdrawWithRatio(ether('1'), ether('0'), { from: wallet1 });
            expect(await this.fixedRateSwap.balanceOf(wallet1)).to.be.bignumber.equal(ether('1'));
            assertRoughlyEqualValues(ether('1'), await this.USDT.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('0.000107'), await this.USDC.balanceOf(this.fixedRateSwap.address), 0.01);
            assertRoughlyEqualValues(ether('9'), await this.USDT.balanceOf(wallet1), 0.01);
            assertRoughlyEqualValues(ether('10'), await this.USDC.balanceOf(wallet1), 0.01);
        });

        it('should revert when withdraw too much', async function () {
            await expectRevert(
                this.fixedRateSwap.withdraw(ether('3'), { from: wallet1 }),
                'ERC20: burn amount exceeds balance',
            );
        });

        it('should revert when withdraw too much in one token', async function () {
            await expectRevert(
                this.fixedRateSwap.withdrawWithRatio(ether('2'), ether('0'), { from: wallet1 }),
                'Withdraw amount exceeds total contract balance',
            );
        });

        it.skip('deposit/withdraw should be more expensive than swap', async function () {
            await this.fixedRateSwap.deposit(ether('3'), ether('0'), { from: wallet1 });
            const withdrawResult = await this.fixedRateSwap.contract.methods.withdrawWithRatio(ether('1'), ether('0')).call({ from: wallet1 });
            await this.fixedRateSwap.deposit(ether('0'), ether('3'), { from: wallet1 });
            const preSwapBalance = await this.USDC.balanceOf(wallet1);
            const swapResult = await this.fixedRateSwap.swap0To1(ether('1'), { from: wallet1 });
            const postSwapBalance = await this.USDC.balanceOf(wallet1);
            const swapDiff = postSwapBalance.sub(preSwapBalance);
            expect(withdrawResult.token1Amount).to.be.bignumber.lt(swapDiff);
        });
    });

    describe('Swaps', async function () {
        beforeEach(async function () {
            await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
        });

        it('should swap directly', async function () {
            await this.fixedRateSwap.swap0To1(ether('1'), { from: wallet2 });
            expect(await this.USDT.balanceOf(wallet2)).to.bignumber.equal(ether('9'));
            expect(await this.USDC.balanceOf(wallet2)).to.bignumber.equal(ether('10.999785325996316875'));
        });

        it('should swap inversly', async function () {
            await this.fixedRateSwap.swap1To0(ether('1'), { from: wallet2 });
            expect(await this.USDC.balanceOf(wallet2)).to.bignumber.equal(ether('9'));
            expect(await this.USDT.balanceOf(wallet2)).to.bignumber.equal(ether('10.999785325996316875'));
        });
    });

    it('should withdraw all after swap', async function () {
        await this.fixedRateSwap.deposit(ether('1'), ether('1'), { from: wallet1 });
        await this.fixedRateSwap.swap0To1(ether('1'), { from: wallet2 });
        await this.fixedRateSwap.withdraw(ether('2'), { from: wallet1 });
        expect(await this.USDT.balanceOf(wallet1)).to.be.bignumber.equal(ether('11'));
        expect(await this.USDC.balanceOf(wallet1)).to.be.bignumber.equal(ether('9.000214674003683125'));
    });
});
