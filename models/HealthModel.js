class HealthModel {
    constructor(name, age, height, weight) {
        if (!name || !age || !height || !weight) {
            throw new Error("Semua field harus diisi: name, age, height, weight");
        }

        this.id = Date.now();
        this.name = String(name);
        this.age = Number(age);
        this.height = Number(height);
        this.weight = Number(weight);
        this.bmi = this.calculateBMI();
        this.category = this.getBMICategory();
        this.createdAt = new Date().toISOString();
    }

    calculateBMI() {
        const heightInMeter = this.height / 100;
        if (!heightInMeter || heightInMeter <= 0) {
            return "0.00";
        }
        return (this.weight / (heightInMeter * heightInMeter)).toFixed(2);
    }

    getBMICategory() {
        const bmi = parseFloat(this.bmi);

        if (bmi < 18.5) {
            return "Kurus";
        }
        if (bmi < 25) {
            return "Normal";
        }
        if (bmi < 30) {
            return "Gemuk";
        }
        return "Obesitas";
    }

    update(name, age, height, weight) {
        this.name = String(name);
        this.age = Number(age);
        this.height = Number(height);
        this.weight = Number(weight);
        this.bmi = this.calculateBMI();
        this.category = this.getBMICategory();
        this.updatedAt = new Date().toISOString();
        return this;
    }
}

module.exports = HealthModel;