/**
 * PDF Generator for SplitTheBill
 * Generates professional expense reports using jsPDF
 */

class PDFGenerator {
    constructor() {
        this.loadJsPDF();
    }

    /**
     * Load jsPDF library dynamically
     */
    async loadJsPDF() {
        if (typeof window.jsPDF === 'undefined') {
            try {
                // Load jsPDF from CDN
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => {
                    console.log('jsPDF loaded successfully');
                };
                script.onerror = () => {
                    console.error('Failed to load jsPDF');
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Error loading jsPDF:', error);
            }
        }
    }

    /**
     * Generate expense report PDF
     * @param {Object} options - Report options
     * @param {string} options.groupId - Group ID
     * @param {string} options.groupName - Group name
     * @param {Array} options.expenses - Array of expenses
     * @param {Array} options.members - Array of group members
     * @param {string} options.dateRange - Date range for the report
     * @param {string} options.reportType - Type of report (summary, detailed, individual)
     */
    async generateExpenseReport(options) {
        try {
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('jsPDF library not loaded');
            }

            const { jsPDF } = window;
            const doc = new jsPDF();

            // Set up document properties
            doc.setProperties({
                title: `${options.groupName} - Expense Report`,
                subject: 'Expense Report',
                author: 'SplitTheBill',
                creator: 'SplitTheBill App'
            });

            // Generate report based on type
            switch (options.reportType) {
                case 'summary':
                    this.generateSummaryReport(doc, options);
                    break;
                case 'detailed':
                    this.generateDetailedReport(doc, options);
                    break;
                case 'individual':
                    this.generateIndividualReport(doc, options);
                    break;
                default:
                    this.generateSummaryReport(doc, options);
            }

            // Save the PDF
            const fileName = `${options.groupName.replace(/[^a-z0-9]/gi, '_')}_expense_report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            return { success: true, fileName };
        } catch (error) {
            console.error('Error generating PDF:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate summary report
     */
    generateSummaryReport(doc, options) {
        let yPosition = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Report - Summary', 20, yPosition);
        yPosition += 15;

        // Group info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Group: ${options.groupName}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
        yPosition += 8;
        if (options.dateRange) {
            doc.text(`Period: ${options.dateRange}`, 20, yPosition);
            yPosition += 8;
        }
        yPosition += 10;

        // Summary statistics
        const totalExpenses = options.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const avgExpense = totalExpenses / options.expenses.length || 0;

        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics:', 20, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
        doc.text(`Number of Expenses: ${options.expenses.length}`, 30, yPosition);
        yPosition += 8;
        doc.text(`Average Expense: $${avgExpense.toFixed(2)}`, 30, yPosition);
        yPosition += 15;

        // Member balances
        doc.setFont('helvetica', 'bold');
        doc.text('Member Balances:', 20, yPosition);
        yPosition += 10;

        const balances = this.calculateMemberBalances(options.expenses, options.members);
        doc.setFont('helvetica', 'normal');
        
        Object.entries(balances).forEach(([memberId, balance]) => {
            const member = options.members.find(m => m.id === memberId);
            const memberName = member ? member.name : 'Unknown';
            const balanceText = balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`;
            const color = balance >= 0 ? [0, 128, 0] : [255, 0, 0];
            
            doc.setTextColor(...color);
            doc.text(`${memberName}: ${balanceText}`, 30, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 8;
        });

        yPosition += 10;

        // Recent expenses (top 10)
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Expenses:', 20, yPosition);
        yPosition += 10;

        const recentExpenses = options.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        doc.setFont('helvetica', 'normal');
        recentExpenses.forEach(expense => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            const dateStr = new Date(expense.date).toLocaleDateString();
            doc.text(`${dateStr} - ${expense.title}: $${expense.amount.toFixed(2)}`, 30, yPosition);
            yPosition += 8;
        });

        // Footer
        this.addFooter(doc);
    }

    /**
     * Generate detailed report
     */
    generateDetailedReport(doc, options) {
        let yPosition = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Report - Detailed', 20, yPosition);
        yPosition += 15;

        // Group info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Group: ${options.groupName}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
        yPosition += 15;

        // All expenses
        doc.setFont('helvetica', 'bold');
        doc.text('All Expenses:', 20, yPosition);
        yPosition += 10;

        const sortedExpenses = options.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach((expense, index) => {
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${expense.title}`, 20, yPosition);
            yPosition += 8;

            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${new Date(expense.date).toLocaleDateString()}`, 30, yPosition);
            yPosition += 6;
            doc.text(`Amount: $${expense.amount.toFixed(2)}`, 30, yPosition);
            yPosition += 6;
            doc.text(`Category: ${expense.category || 'Other'}`, 30, yPosition);
            yPosition += 6;
            
            if (expense.description) {
                doc.text(`Description: ${expense.description}`, 30, yPosition);
                yPosition += 6;
            }

            doc.text(`Split Method: ${expense.splitMethod || 'Equal'}`, 30, yPosition);
            yPosition += 6;

            // Participants
            if (expense.participants && expense.participants.length > 0) {
                doc.text('Participants:', 30, yPosition);
                yPosition += 6;
                
                expense.participants.forEach(participant => {
                    const member = options.members.find(m => m.id === participant.memberId);
                    const memberName = member ? member.name : 'Unknown';
                    doc.text(`  - ${memberName}: $${participant.amount.toFixed(2)}`, 40, yPosition);
                    yPosition += 6;
                });
            }

            yPosition += 5;
        });

        // Footer
        this.addFooter(doc);
    }

    /**
     * Generate individual member report
     */
    generateIndividualReport(doc, options) {
        const { memberId } = options;
        const member = options.members.find(m => m.id === memberId);
        
        if (!member) {
            throw new Error('Member not found');
        }
+
+        const nameToShow = member.displayName || member.name || member.email || 'Unknown';
        let yPosition = 20;

        // Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
-        doc.text(`Individual Report - ${member.name}`, 20, yPosition);
+        doc.text(`Individual Report - ${nameToShow}`, 20, yPosition);
        yPosition += 15;

        // Member info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Group: ${options.groupName}`, 20, yPosition);
        yPosition += 8;
-        doc.text(`Member: ${member.name}`, 20, yPosition);
+        doc.text(`Member: ${nameToShow}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
        yPosition += 15;

        // Member's expenses
        const memberExpenses = options.expenses.filter(expense => 
            expense.paidBy === memberId || 
            (expense.participants && expense.participants.some(p => p.memberId === memberId))
        );

        const paidExpenses = memberExpenses.filter(expense => expense.paidBy === memberId);
        const involvedExpenses = memberExpenses.filter(expense => 
            expense.participants && expense.participants.some(p => p.memberId === memberId)
        );

        // Summary for this member
        const totalPaid = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalOwed = involvedExpenses.reduce((sum, expense) => {
            const participation = expense.participants.find(p => p.memberId === memberId);
            return sum + (participation ? participation.amount : 0);
        }, 0);
        const balance = totalPaid - totalOwed;

        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 20, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.text(`Total Paid: $${totalPaid.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
        doc.text(`Total Owed: $${totalOwed.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
        
        const balanceColor = balance >= 0 ? [0, 128, 0] : [255, 0, 0];
        const balanceText = balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`;
        doc.setTextColor(...balanceColor);
        doc.text(`Balance: ${balanceText}`, 30, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 15;

        // Expenses paid by this member
        if (paidExpenses.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Expenses Paid:', 20, yPosition);
            yPosition += 10;

            doc.setFont('helvetica', 'normal');
            paidExpenses.forEach(expense => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                const dateStr = new Date(expense.date).toLocaleDateString();
                doc.text(`${dateStr} - ${expense.title}: $${expense.amount.toFixed(2)}`, 30, yPosition);
                yPosition += 8;
            });
            yPosition += 10;
        }

        // Footer
        this.addFooter(doc);
    }

    /**
     * Calculate member balances
     */
    calculateMemberBalances(expenses, members) {
        const balances = {};
        
        // Initialize balances
        members.forEach(member => {
            balances[member.id] = 0;
        });

        // Calculate balances
        expenses.forEach(expense => {
            // Add amount paid
            if (expense.paidBy && balances.hasOwnProperty(expense.paidBy)) {
                balances[expense.paidBy] += expense.amount;
            }

            // Subtract amount owed
            if (expense.participants) {
                expense.participants.forEach(participant => {
                    if (balances.hasOwnProperty(participant.memberId)) {
                        balances[participant.memberId] -= participant.amount;
                    }
                });
            }
        });

        return balances;
    }

    /**
     * Add footer to PDF
     */
    addFooter(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(128, 128, 128);
            
            // Footer text
            doc.text('Generated by SplitTheBill', 20, 285);
            doc.text(`Page ${i} of ${pageCount}`, 170, 285);
            doc.text(new Date().toLocaleString(), 20, 290);
        }
    }

    /**
     * Export group data as JSON
     */
    exportGroupData(groupData) {
        try {
            const dataStr = JSON.stringify(groupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${groupData.name.replace(/[^a-z0-9]/gi, '_')}_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting group data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export expenses as CSV
     */
    exportExpensesCSV(expenses, groupName) {
        try {
            const headers = ['Date', 'Title', 'Amount', 'Category', 'Description', 'Paid By', 'Split Method'];
            const csvContent = [headers.join(',')];
            
            expenses.forEach(expense => {
                const row = [
                    new Date(expense.date).toLocaleDateString(),
                    `"${expense.title}"`,
                    expense.amount,
                    expense.category || 'Other',
                    `"${expense.description || ''}"`,
                    expense.paidByName || 'Unknown',
                    expense.splitMethod || 'Equal'
                ];
                csvContent.push(row.join(','));
            });
            
            const csvBlob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(csvBlob);
            link.download = `${groupName.replace(/[^a-z0-9]/gi, '_')}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting CSV:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFGenerator;
} else {
    window.PDFGenerator = PDFGenerator;
}