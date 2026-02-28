<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;

class RuleRepository
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * Get rules for a shift.
     * 
     * @param int $limit Number of rules to retrieve
     * @return array List of rules
     */
    public function getShiftRules(int $limit = 3): array
    {
        $stmt = $this->pdo->prepare('
            SELECT id, title, description, difficulty, type 
            FROM shift_rules 
            ORDER BY RAND() 
            LIMIT :limit
        ');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
